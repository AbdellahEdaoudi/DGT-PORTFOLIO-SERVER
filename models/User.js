const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: String,
  email: { type: String, unique: true, required: true },
  username: String,
  phoneNumber: String,
  country: String,
  category: String,
  urlimage: String,
  bgcolorp: String,
  about: String,
  languages: [String],
  services: [String],
  skills: [String],
  education: [
    {
      school: String,
      degree: String,
      field: String,
      startYear: String,
      endYear: String,
    },
  ],
  experience: [
    {
      company: String,
      role: String,
      description: String,
      startDate: String,
      endDate: String,
    },
  ],
  projects: [
    {
      title: String,
      description: String,
      link: String,
      image: String,
      technologies: [String],
      startDate: String,
      endDate: String,
    },
  ],
  certificates: [
    {
      description: String,
      cfimage: String,
    },
  ],
  socials: {
    github: String,
    linkedin: String,
    fb: String,
    instagram: String,
    twitter: String,
    youtube: String,
    telegram: String,
    snapchat: String,
    whatsapp: String,
    tiktok: String,
    reddit: String,
    twitch: String,
  },
  sectionOrder: {
    type: [String],
    default: ["services", "experience", "skills", "projects", "education", "certificates", "languages"]
  },
  theme: Number,
  displayLanguage: {
    type: String,
    default: "en",
    enum: ["en", "fr", "ar", "de", "ru", "ja", "zh", "es", "nl"],
  },
  customDomain: {
    type: String,
    default: null,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  customDomainVerified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
