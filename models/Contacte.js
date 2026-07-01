const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  email: { type: String, required: true },
  subject: { type: String },
  message: { type: String, required: true },
  attachment: { type: String },
  adminReply: { type: String, default: "" },
  adminReplyImage: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.models.Contact || mongoose.model('Contact', contactSchema);
