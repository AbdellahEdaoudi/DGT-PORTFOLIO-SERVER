const mongoose = require('mongoose');

const LinksSchema = new mongoose.Schema({
  useremail: {
      type: String,
      required: true,
      trim: true
  },
  namelink: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.models.Links || mongoose.model('Links', LinksSchema);
