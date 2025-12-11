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
      const up = await cloudinary.uploader.upload(req.file.path);
      userData.urlimage = up.secure_url;

      const currentUser = await User.findOne({ email });
      if (currentUser?.urlimage) {
        const publicId = currentUser.urlimage.split('/').pop().split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
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
    if (education.length > 10) {
      return res.status(400).json({ error: "Maximum 10 education items allowed" });
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
    if (experience.length > 10) {
      return res.status(400).json({ error: "Maximum 10 experience items allowed" });
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
exports.UpUserCertificates = async (req, res) => {
  const { email } = req.user;

  try {
    let certificates = req.body.certificates;

    // If sent via FormData, it might be stringified
    if (typeof certificates === "string") {
      try {
        certificates = JSON.parse(certificates);
      } catch {
        return res.status(400).json({ error: "Invalid 'certificates' format" });
      }
    }

    if (!Array.isArray(certificates)) {
      return res.status(400).json({ error: "'certificates' must be an array" });
    }
    if (certificates.length > 5) {
      return res.status(400).json({ error: "Maximum 5 certificates allowed" });
    }

    // Handle Uploaded Files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Expecting fieldname format: "image_INDEX" e.g. "image_0"
        if (file.fieldname.startsWith("image_")) {
          const index = parseInt(file.fieldname.split("_")[1]);
          if (!isNaN(index) && certificates[index]) {
            // Check size again (optional, multer limits usually apply but good safety)
            if (file.size > 2 * 1024 * 1024) {
              const fs = require('fs');
              try { fs.unlinkSync(file.path); } catch (e) { }
              return res.status(400).json({ error: "One of the files exceeds 2MB limit" });
            }

            // Upload
            const result = await cloudinary.uploader.upload(file.path, {
              folder: "certificates",
            });

            // Update certificate object
            certificates[index].cfimage = result.secure_url;

            // Clean up
            const fs = require('fs');
            try { fs.unlinkSync(file.path); } catch (e) { }
          }
        }
      }
    }

    // Sanitize and validate
    certificates = certificates.map(item => {
      if (typeof item === "object" && item !== null) {
        return {
          description: item.description ? item.description.trim().substring(0, 200) : "",
          cfimage: item.cfimage ? item.cfimage.trim().substring(0, 1000) : "",
        };
      }
      return null;
    }).filter(item => item !== null);

    const currentUser = await User.findOne({ email });
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    // Handle Deletion logic
    // Find cfimage URLs in the old list that are NOT in the new list
    const oldImages = currentUser.certificates
      .map(c => c.cfimage)
      .filter(url => url);

    const newImages = certificates
      .map(c => c.cfimage)
      .filter(url => url);

    const imagesToDelete = oldImages.filter(url => !newImages.includes(url));

    // Delete removed images from Cloudinary
    for (const url of imagesToDelete) {
      try {
        // Extract public_id from URL
        const parts = url.split('/');
        const filename = parts.pop();
        const publicId = filename.split('.')[0];

        let idToDelete = publicId;
        // Check if previous part is the folder name we expect
        if (parts.length > 0 && parts[parts.length - 1] === 'certificates') {
          idToDelete = `certificates/${publicId}`;
        }

        await cloudinary.uploader.destroy(idToDelete);
      } catch (err) {
        console.error(`Failed to delete image ${url}:`, err);
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { certificates } },
      { new: true }
    );

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating certificates:", error);
    // Clean up any uploaded files if error occurs (optional but good)
    if (req.files) {
      const fs = require('fs');
      req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch (e) { } });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.uploadCertificateImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (req.file.size > 2 * 1024 * 1024) { // 2MB limit
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "File size must not exceed 2MB" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "certificates",
    });

    // Clean up local file
    // Note: If using memory storage, this isn't needed. But middleware says diskStorage.
    // However, multer middleware code viewed earlier didn't seem to delete it automatically.
    // It's good practice to delete logic in cloud uploader if using disk.
    // Wait, the project usually relies on cloudinary utils or just uploads from path.
    // The previous code in updateUserByEmail did: 
    // const result = await cloudinary.uploader.upload(req.file.path);
    // AND it didn't explicitly delete the file in that specific block? 
    // Actually UpUserInfo deletes it if size > limit. But doesn't delete on success?
    // Using fs.unlinkSync(req.file.path) is safer to avoid filling disk.
    // Let's check UpUserInfo again. It DOESN'T delete on success.
    // This is a potential issue in the codebase but I should probably follow suit or fix it.
    // Better to delete it.

    const fs = require('fs');
    if (fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) { console.error("Could not delete temp file", e) }
    }

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Error uploading certificate:", error);
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

    const validLanguages = ["en", "fr", "ar", "de", "ru", "ja", "zh", "es"];
    if (!validLanguages.includes(displayLanguage)) {
      return res.status(400).json({ error: "Invalid language. Must be one of: en, fr, ar, de, ru, ja, zh, es" });
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
