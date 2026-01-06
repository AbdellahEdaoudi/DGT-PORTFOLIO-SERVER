const User = require('../models/User');
const Links = require('../models/Links');
const cloudinary = require("../utils/cloudinary");
const sanitizeHtml = require('sanitize-html');
const Subscription = require('../models/Subscription');
const { sendEmail, welcomeTemplate } = require('../utils/emailService');

const capitalizeWords = (str) => {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, ' ');
};

// 🟢 Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-__v");
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
    userData.username = userData.username.replace(/[.\s/]/g, "").toLowerCase();
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

    // Send Welcome Email
    try {
      const emailContent = welcomeTemplate(newUser.username || newUser.fullname);
      await sendEmail(newUser.email, "Welcome to DGT Portfolio!", emailContent);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Continue without failing registration
    }

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
      if (req.file.size > 200 * 1024) {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Image size must not exceed 200KB" });
      }

      const up = await cloudinary.uploader.upload(req.file.path, {
        folder: "User_Images"
      });
      userData.urlimage = up.secure_url;

      const currentUser = await User.findOne({ email });
      if (currentUser?.urlimage) {
        try {
          // Attempt to extract public_id from URL
          // URL format: https://res.cloudinary.com/cloud_name/image/upload/v12345678/folder/public_id.jpg
          const urlParts = currentUser.urlimage.split('/');
          const versionIndex = urlParts.findIndex(part => part.startsWith('v') && !isNaN(part.substring(1)));

          if (versionIndex !== -1) {
            const publicIdWithExt = urlParts.slice(versionIndex + 1).join('/');
            const publicId = publicIdWithExt.split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          } else {
            // Fallback for older images without folder or standard structure
            const publicId = currentUser.urlimage.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (err) {
          console.error("Error deleting old image:", err);
        }
      }
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
    if (languages.length > 10) {
      return res.status(400).json({ error: "Maximum 10 languages allowed" });
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
    if (services.length > 10) {
      return res.status(400).json({ error: "Maximum 10 services allowed" });
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
    if (skills.length > 10) {
      return res.status(400).json({ error: "Maximum 10 skills allowed" });
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
exports.UpUserDisplayLanguage = async (req, res) => {
  const { email } = req.user;

  try {
    let { displayLanguage } = req.body;

    if (!displayLanguage || typeof displayLanguage !== "string") {
      return res.status(400).json({ error: "'displayLanguage' must be a string" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { displayLanguage } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating display language:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.UpUserSectionOrder = async (req, res) => {
  const { email } = req.user;

  try {
    let { sectionOrder } = req.body;

    if (!sectionOrder || !Array.isArray(sectionOrder)) {
      return res.status(400).json({ error: "'sectionOrder' must be an array" });
    }

    // Validate that items are strings (and maybe specific allowed values if needed)
    sectionOrder = sectionOrder.filter(item => typeof item === 'string');

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { sectionOrder } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating section order:", error);
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
    "adam.carter.dev@gmail.com",
    "abdellahedaoudi80@gmail.com",
    "soondiss8@gmail.com",
    "dgt.portfolio.ma@gmail.com",
    "edaoudicontact@gmail.com"
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
// 🟢 Get user by custom domain
exports.getUserByCustomDomain = async (req, res) => {
  const { customDomain } = req.params;
  const user = await User.findOne({ customDomainVerified: true, customDomain }).select("-__v");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const whitelist = [
    "adam.carter.dev@gmail.com",
    "abdellahedaoudi80@gmail.com",
    "soondiss8@gmail.com",
    "dgt.portfolio.ma@gmail.com",
    "edaoudicontact@gmail.com"
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
      .select("fullname username email phoneNumber urlimage about category socials skills displayLanguage");
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

// 🟢 Get user by custom domain
exports.getUserByCustomDomainMeta = async (req, res) => {
  const { customDomain } = req.params;
  try {
    const user = await User.findOne({ customDomainVerified: true, customDomain })
      .select("fullname username email phoneNumber urlimage about category socials skills displayLanguage");
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

// 🟢 Get all usernames for sitemap (including custom domains)
exports.getActiveUsernames = async (req, res) => {
  try {
    // Get all users that have a username
    const allUsers = await User.find({
      username: { $exists: true, $ne: "" }
    })
      .select("username customDomain customDomainVerified")
      .lean();

    // Extract usernames and custom domains
    const usernames = allUsers.map(user => user.username);
    const customDomains = allUsers
      .filter(user => user.customDomain && user.customDomainVerified)
      .map(user => ({
        username: user.username,
        customDomain: user.customDomain
      }));

    res.json({ usernames, customDomains });
  } catch (error) {
    console.error("Error fetching usernames:", error);
    res.status(500).json({ error: error.message });
  }
};
