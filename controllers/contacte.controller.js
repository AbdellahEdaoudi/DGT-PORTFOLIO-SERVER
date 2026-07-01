const Contacte = require("../models/Contacte");
const sanitizeHtml = require('sanitize-html');
const cloudinary = require("../utils/cloudinary");

exports.getContacts = async (req, res) => {
  const reqemail = req.user?.email;
  if (reqemail !== process.env.EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const contacts = await Contacte.find();
    res.json(contacts); // Default status code is 200
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching contacts", error });
  }
};

exports.createContact = async (req, res) => {
  const ContactData = req.body;
  if (ContactData.email !== req.user?.email) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  for (const key in ContactData) {
    if (key === 'attachment') continue;
    if (typeof ContactData[key] === 'string') {
      ContactData[key] = sanitizeHtml(ContactData[key]);
    }
  }
  if (ContactData.message) ContactData.message = ContactData.message.substring(0, 500);
  if (ContactData.subject) ContactData.subject = ContactData.subject.substring(0, 100);

  try {
    const count = await Contacte.countDocuments({ email: req.user?.email });
    if (count >= 2) {
      return res.status(400).json({ success: false, message: "Maximum 2 messages allowed" });
    }
    if (ContactData.attachment) {
      try {
        const uploadResult = await cloudinary.uploader.upload(ContactData.attachment, {
          folder: "support_attachments",
          resource_type: "auto"
        });
        ContactData.attachment = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload attachment", error: uploadError.message });
      }
    }
    const newContact = new Contacte(ContactData);
    const savedContact = await newContact.save();
    res.json(savedContact);
  } catch (error) {
    res.status(500).json({ message: "An error occurred while creating the contact", error });
  }
};

// Get all contacts belonging to the logged-in user
exports.getUserContacts = async (req, res) => {
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: "Unauthorized" });
  try {
    const contacts = await Contacte.find({ email }).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching user contacts", error });
  }
};

// Delete a contact owned by the logged-in user
exports.deleteUserContact = async (req, res) => {
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: "Unauthorized" });
  try {
    const contact = await Contacte.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    if (contact.email !== email) return res.status(403).json({ message: "Forbidden" });

    // Delete attachment from Cloudinary if exists
    if (contact.attachment) {
      try {
        const urlParts = contact.attachment.split('/');
        const fileWithExt = urlParts[urlParts.length - 1];
        const publicId = `support_attachments/${fileWithExt.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudErr) {
        console.error("Cloudinary delete error:", cloudErr.message);
      }
    }

    await Contacte.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Contact deleted" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while deleting the contact", error });
  }
};

