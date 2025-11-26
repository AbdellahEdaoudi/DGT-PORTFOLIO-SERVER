const User = require('../models/User');
const Links = require('../models/Links');
const cloudinary = require("../utils/cloudinary");
const sanitizeHtml = require('sanitize-html');
const fetch = require('node-fetch');
const Subscription = require('../models/Subscription');
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_SECRET;
const BASE = process.env.BASE; // استخدم Live لاحقًا https://api-m.paypal.com

const capitalizeWords = (str) => {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, ' ');
};
// الحصول على توكن الوصول من PayPal
async function getAccessToken() {
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + SECRET).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  return data.access_token;
}
async function getPayPalSubscriptionStatus(subscriptionID) {
  const accessToken = await getAccessToken();

  const res = await fetch(`${BASE}/v1/billing/subscriptions/${subscriptionID}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await res.json();
  return data.status; // ACTIVE, SUSPENDED, CANCELLED, EXPIRED
}
// 🟢 Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().collation({ locale: 'en', strength: 1 }).sort({ fullname: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// 🟢 Create user
exports.createUser = async (req, res) => {
  const userData = req.body;
  if (userData.email !== req.user?.email) {
    return res.status(403).json({ message: "Forbidden" });
  }

  for (const key in userData) {
    if (typeof userData[key] === 'string') {
      userData[key] = sanitizeHtml(userData[key]);
    }
  }

  if (userData.fullname) {
    const words = userData.fullname.trim().split(/\s+/);
    userData.fullname = words.length > 2 ? words.slice(0, 2).join(' ') : words.join(' ');
    if (userData.fullname.length > 20) {
      userData.fullname = userData.fullname.substring(0, 20);
    }
    userData.fullname = capitalizeWords(userData.fullname);
  }

  if (userData.username) {
    if (userData.username.length > 20) {
      userData.username = userData.username.substring(0, 20);
    }
    userData.username = userData.username.replace(/\s/g, '').toLowerCase();
  }

  try {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(200).json({
        message: "User already exists",
        user: existingUser,
      });
    }
    const newUser = await User.create(userData);
    return res.status(201).json(newUser);
  } catch (error) {
    console.error("❌ Error creating user:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
// 🟢 Update user by email
exports.updateUserByEmail = async (req, res) => {
  const { email } = req.params;
  const reqEmail = req.user?.email;

  if (email !== reqEmail) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const userData = { ...req.body };
    delete userData.email;

    for (const key in userData) {
      if (typeof userData[key] === "string") {
        userData[key] = sanitizeHtml(userData[key]);
      }
    }

    if (userData.fullname) {
      const words = userData.fullname.trim().split(/\s+/);
      userData.fullname =
        words.length > 2 ? words.slice(0, 2).join(" ") : words.join(" ");
      if (userData.fullname.length > 20)
        userData.fullname = userData.fullname.substring(0, 20);
      userData.fullname = userData.fullname
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }

    if (userData.username) {
      userData.username = userData.username
        .replace(/\s/g, "")
        .toLowerCase()
        .substring(0, 20);
      const existingUser = await User.findOne({ username: userData.username });
      if (existingUser && existingUser.email !== email) {
        return res.status(400).json({ error: "Username already exists" });
      }
    }

    const parseIfJson = (value) => {
      try {
        return typeof value === "string" ? JSON.parse(value) : value;
      } catch {
        return value;
      }
    };

    userData.languages = parseIfJson(userData.languages);
    userData.services = parseIfJson(userData.services);
    userData.skills = parseIfJson(userData.skills);
    userData.education = parseIfJson(userData.education);
    userData.experience = parseIfJson(userData.experience);
    userData.projects = parseIfJson(userData.projects);

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      userData.urlimage = result.secure_url;
    }

    const updatedUser = await User.findOneAndUpdate({ email }, userData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: error.message });
  }
};
// 🟢 UpUserInfo
exports.UpUserInfo = async (req, res) => {
  const { email } = req.user;

  try {
    const allowedFields = ["fullname", "username", "phoneNumber", "country", "category"];
    const userData = {};
    allowedFields.forEach((f) => {
      if (req.body[f]) {
        let val = sanitizeHtml(req.body[f].trim());
        userData[f] = val.substring(0, 100);
      }
    });

    // if (userData.fullname) {
    //   userData.fullname = userData.fullname
    //     .split(/\s+/)
    //     .slice(0, 2)
    //     .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    //     .join(" ");
    // }
    if (userData.fullname) {
      userData.fullname = userData.fullname.substring(0, 50);
    }
    if (userData.username) {
      userData.username = userData.username.replace(/[.\s]/g, "").toLowerCase().substring(0, 30);
      const existingUser = await User.findOne({ username: userData.username });
      if (existingUser && existingUser.email !== email)
        return res.status(400).json({ error: "Username already exists" });
    }
    if (req.file) {
      const up = await cloudinary.uploader.upload(req.file.path);
      userData.urlimage = up.secure_url;
    }
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: userData },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: err.message });
  }
};
exports.UpUserAbout = async (req, res) => {
  const { email } = req.user;
  try {
    let { about } = req.body;

    if (typeof about === "string") {
      about = sanitizeHtml(about.trim()).substring(0, 500);
    } else {
      return res.status(400).json({ error: "Invalid 'about' field" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { about } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating about:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.UpUserBgColor = async (req, res) => {
  const { email } = req.user;

  try {
    let { bgcolorp } = req.body;

    if (typeof bgcolorp === "string") {
      bgcolorp = sanitizeHtml(bgcolorp.trim()).substring(0, 50);
    } else {
      return res.status(400).json({ error: "Invalid 'bgcolorp' field" });
    }
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { bgcolorp } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating bgcolorp:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.UpUserLanguages = async (req, res) => {
  const { email } = req.user;

  try {
    let { languages } = req.body;
    if (typeof languages === "string") {
      try {
        languages = JSON.parse(languages);
      } catch {
        return res.status(400).json({ error: "Invalid 'languages' format" });
      }
    }

    if (!Array.isArray(languages)) {
      return res.status(400).json({ error: "'languages' must be an array" });
    }
    languages = languages.map(lang => {
      if (typeof lang === "string") {
        return lang.trim().substring(0, 50);
      }
      return "";
    }).filter(lang => lang);

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { languages } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating languages:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.UpUserServices = async (req, res) => {
  const { email } = req.user;

  try {
    let { services } = req.body;

    if (typeof services === "string") {
      try {
        services = JSON.parse(services);
      } catch {
        return res.status(400).json({ error: "Invalid 'services' format" });
      }
    }

    if (!Array.isArray(services)) {
      return res.status(400).json({ error: "'services' must be an array" });
    }
    services = services.map(serv => {
      if (typeof serv === "string") {
        return serv.trim().substring(0, 150);
      }
      return "";
    }).filter(serv => serv);

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { services } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating services:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.UpUserSkills = async (req, res) => {
  const { email } = req.user;

  try {
    let { skills } = req.body;

    if (typeof skills === "string") {
      try {
        skills = JSON.parse(skills);
      } catch {
        return res.status(400).json({ error: "Invalid 'skills' format" });
      }
    }

    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: "'skills' must be an array" });
    }
    skills = skills.map(skil => {
      if (typeof skil === "string") {
        return skil.trim().substring(0, 130);
      }
      return "";
    }).filter(skil => skil);

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { skills } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating skills:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.UpUserEducation = async (req, res) => {
  const { email } = req.user;

  try {
    let { education } = req.body;

    if (typeof education === "string") {
      try {
        education = JSON.parse(education);
      } catch {
        return res.status(400).json({ error: "Invalid 'education' format" });
      }
    }

    if (!Array.isArray(education)) {
      return res.status(400).json({ error: "'education' must be an array" });
    }
    education = education.filter(item =>
      Object.values(item || {}).some(v => v && v.toString().trim() !== "")
    );
    education = education.map(item => {
      if (typeof item === "object" && item !== null) {
        return {
          school: item.school ? item.school.trim().substring(0, 100) : "",
          degree: item.degree ? item.degree.trim().substring(0, 100) : "",
          field: item.field ? item.field.trim().substring(0, 100) : "",
          startYear: item.startYear ? item.startYear.trim().substring(0, 20) : "",
          endYear: item.endYear ? item.endYear.trim().substring(0, 20) : "",
        };
      }
      return null;
    }).filter(item => item !== null);

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { education } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating education:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.UpUserExperience = async (req, res) => {
  const { email } = req.user;

  try {
    let { experience } = req.body;

    if (typeof experience === "string") {
      try {
        experience = JSON.parse(experience);
      } catch {
        return res.status(400).json({ error: "Invalid 'experience' format" });
      }
    }

    if (!Array.isArray(experience)) {
      return res.status(400).json({ error: "'experience' must be an array" });
    }
    experience = experience.filter(item =>
      Object.values(item || {}).some(v => v && v.toString().trim() !== "")
    );
    experience = experience.map(item => {
      if (typeof item === "object" && item !== null) {
        return {
          company: item.company ? item.company.trim().substring(0, 100) : "",
          role: item.role ? item.role.trim().substring(0, 100) : "",
          description: item.description ? item.description.trim().substring(0, 2000) : "",
          startDate: item.startDate ? item.startDate.trim().substring(0, 20) : "",
          endDate: item.endDate ? item.endDate.trim().substring(0, 20) : "",
        };
      }
      return null;
    }).filter(item => item !== null);

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { experience } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating experience:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.UpUserProjects = async (req, res) => {
  const { email } = req.user;

  try {
    let { projects } = req.body;

    if (typeof projects === "string") {
      try {
        projects = JSON.parse(projects);
      } catch {
        return res.status(400).json({ error: "Invalid 'projects' format" });
      }
    }

    if (!Array.isArray(projects)) {
      return res.status(400).json({ error: "'projects' must be an array" });
    }
    projects = projects.filter(p =>
      Object.values(p).some(v => v && v.toString().trim() !== "")
    );
    projects = projects.map(item => {
      if (typeof item === "object" && item !== null) {
        let techs = Array.isArray(item.technologies)
          ? item.technologies
            .map(t => (typeof t === "string" ? t.trim().substring(0, 20) : ""))
            .filter(t => t)
          : [];

        return {
          title: item.title ? item.title.trim().substring(0, 100) : "",
          description: item.description ? item.description.trim().substring(0, 2000) : "",
          link: item.link ? item.link.trim().substring(0, 1000) : "",
          image: item.image ? item.image.trim().substring(0, 1000) : "",
          technologies: techs,
          startDate: item.startDate ? item.startDate.trim().substring(0, 20) : "",
          endDate: item.endDate ? item.endDate.trim().substring(0, 20) : "",
        };
      }
      return null;
    }).filter(item => item !== null);

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { projects } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating projects:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.UpUserSocials = async (req, res) => {
  const { email } = req.user;

  try {
    const { socials } = req.body;

    if (!socials || typeof socials !== "object")
      return res.status(400).json({ error: "'socials' must be an object" });

    const sanitizedSocials = {};
    for (const key in socials) {
      if (typeof socials[key] === "string") {
        sanitizedSocials[key] = sanitizeHtml(socials[key].trim()).substring(0, 500);
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { socials: sanitizedSocials } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating socials:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.UpUserTheme = async (req, res) => {
  const { email } = req.user;

  try {
    let { theme } = req.body;

    if (theme === undefined || typeof theme !== "number") {
      return res.status(400).json({ error: "'theme' must be a number" });
    }
    theme = String(theme).trim().substring(0, 20);
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { theme } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating theme:", error);
    res.status(500).json({ error: error.message });
  }
};
// 🟢 Get user by email
exports.getUserByEmail = async (req, res) => {
  const { email } = req.params;
  const reqEmail = req.user.email;
  if (email !== reqEmail) {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const user = await User.findOne({ email }).select('-updatedAt -createdAt -__v').lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// 🟢 Get user by username
exports.getUserByUsername = async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username }).select("-__v");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const whitelist = [
    "liam.carter.dev@gmail.com",
    "abdellahedaoudi80@gmail.com",
    "soondiss8@gmail.com",
    "dgt.portfolio.ma@gmail.com"
  ];
  const createdAt = new Date(user.createdAt);
  const sevenDaysLater = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const isWithin7Days = sevenDaysLater > now;
  if (whitelist.includes(user.email) || isWithin7Days) {
    const links = await Links.find({ useremail: user.email }).select("namelink link");
    return res.status(200).json({
      status: 200,
      user,
      links,
      note: "User is whitelisted, subscription check skipped."
    });
  }
    const subscription = await Subscription.findOne({ userEmail: user.email });
    if (!subscription) {
      return res.status(404).json({ message: "No subscription found for this user", email: user.email });
    }
    if (subscription.status !== "ACTIVE") {
      return res.status(403).json({ message: "Your subscription is not active. Please renew or subscribe." });
    }
    const links = await Links.find({ useremail: user.email }).select("namelink link");
    res.status(200).json({
      status: 200,
      user,
      links,
    });
};
// 🟢 Get user by username
exports.getUserByUsernameMeta = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username })
      .select("fullname email phoneNumber urlimage about category socials");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      status: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🟢 Get all usernames for sitemap (no conditions)
exports.getActiveUsernames = async (req, res) => {
  try {
    // Get all users that have a username
    const allUsers = await User.find({
      username: { $exists: true, $ne: "" }
    })
    .select("username")
    .lean();

    // Extract usernames
    const usernames = allUsers.map(user => user.username);

    res.json({ usernames });
  } catch (error) {
    console.error("Error fetching usernames:", error);
    res.status(500).json({ error: error.message });
  }
};
