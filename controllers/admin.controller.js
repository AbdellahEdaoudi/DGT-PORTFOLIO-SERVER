// controller/general.controller.js
const User = require("../models/User");
const Links = require("../models/Links");
const Contact = require("../models/Contacte");
const Contacte = require("../models/Contacte");
const Payment = require("../models/Payment");

const { sendEmail, trialExpiredTemplate } = require("../utils/emailService");
const cloudinary = require("../utils/cloudinary");


exports.GetDataApp = async (req, res) => {
  try {
    const email = req.user?.email;
    if (email !== process.env.EMAIL) {
      return res.json({ success: false, message: "data count 0" });
    }
    const [users, links, contacts, payment] = await Promise.all([
      User.find().collation({ locale: "en", strength: 1 }).sort({ fullname: 1 })
        .select("about fullname email username country category createdAt urlimage theme").lean(),
      Links.find().select("-__v").lean(),
      Contact.find().select("-__v").lean(),
      Payment.find().select("-__v").lean(),
    ]);
    res.status(200).json({
      success: true,
      users,
      links,
      contacts,
      payment
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete user by ID
exports.deleteUserById = async (req, res) => {
  const { id } = req.params;
  const email = req.user.email
  if (email !== process.env.EMAIL) {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const userEmail = deletedUser.email;
    await Links.deleteMany({ useremail: userEmail });
    await Contacte.deleteMany({ email: userEmail });
    res.json({ message: "User and all associated data deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteContactById = async (req, res) => {
  const reqemail = req.user?.email;
  if (reqemail !== process.env.EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const contact = await Contacte.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    if (contact.attachment) {
      const publicId = contact.attachment.split('/').pop().split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`support_attachments/${publicId}`);
      }
    }

    if (contact.adminReplyImage) {
      const publicId = contact.adminReplyImage.split('/').pop().split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`admin_reply_images/${publicId}`);
      }
    }

    const deletedContact = await Contacte.findByIdAndDelete(req.params.id);
    res.json({ message: "Contact deleted successfully", deletedContact }); // Default status code is 200
  } catch (error) {
    res.status(500).json({ message: "An error occurred while deleting the contact", error });
  }
};

// Delete a link by ID
exports.deleteLinkById = async (req, res) => {
  const reqemail = req.user?.email;
  if (reqemail !== process.env.EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const deletedLink = await Links.findByIdAndDelete(req.params.id);
    if (!deletedLink) {
      return res.status(404).json({ message: 'Link not found' });
    }
    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting link', error: error.message });
  }
};

// Send Single Bulk Email
// Send Bulk Emails (Handles both single and batch)
exports.sendBulkEmails = async (req, res) => {
  const reqemail = req.user?.email;
  if (reqemail !== process.env.EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { email, emails, subject, content } = req.body;
  let recipients = [];

  // Determine recipients list
  if (emails && Array.isArray(emails)) {
    recipients = emails;
  } else if (email && typeof email === 'string') {
    recipients = [email];
  } else {
    return res.status(400).json({ message: "Invalid recipients" });
  }

  if (!content) {
    return res.status(400).json({ message: "Content is required" });
  }

  try {
    let successCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        await sendEmail(recipient, subject || "DGT Portfolio", content);
        successCount++;
      } catch (err) {
        console.error(`Failed to send to ${recipient}:`, err);
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `Processed ${recipients.length} emails. Sent: ${successCount}, Failed: ${failedCount}`,
      sentCount: successCount,
      failedCount: failedCount
    });

  } catch (error) {
    console.error("Bulk email error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get Cloudinary Images (and Folders)
exports.getCloudinaryImages = async (req, res) => {
  const reqemail = req.user?.email;
  if (reqemail !== process.env.EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const { next_cursor, folder } = req.query;

    let folders = [];
    let resources = [];
    let next_cursor_res = null;

    // Fetch Folders (only on first page load of a directory view)
    if (!next_cursor || next_cursor === 'undefined' || next_cursor === 'null') {
      try {
        if (folder) {
          // Get subfolders of a specific folder
          const foldersRes = await cloudinary.api.sub_folders(folder);
          folders = foldersRes.folders;
        } else {
          // Get root folders
          const rootFolders = await cloudinary.api.root_folders();
          folders = rootFolders.folders;
        }
      } catch (err) {
        console.error("Folder fetch error:", err.message);
        // Non-critical, continue to fetch resources
      }
    }

    // Fetch Resources
    const options = {
      type: 'upload',
      max_results: 50,
      prefix: folder ? folder + "/" : undefined // Filter by folder
    };

    if (next_cursor && next_cursor !== 'null' && next_cursor !== 'undefined') {
      options.next_cursor = next_cursor;
    }

    // console.log("Fetching cloudinary images with options:", options);

    const result = await cloudinary.api.resources(options);
    resources = result.resources;
    next_cursor_res = result.next_cursor;

    res.json({
      folders,
      resources,
      next_cursor: next_cursor_res
    });

  } catch (error) {
    console.error("Cloudinary API Error:", error);
    res.status(500).json({
      message: "Error fetching Cloudinary images",
      error: error.message || error
    });
  }
};

// Delete Cloudinary Image
exports.deleteCloudinaryImage = async (req, res) => {
  const reqemail = req.user?.email;
  if (reqemail !== process.env.EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ message: "Public ID is required" });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === 'ok') {
      res.json({ message: "Image deleted successfully", public_id });
    } else {
      res.status(400).json({ message: "Failed to delete image", result });
    }

  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    res.status(500).json({
      message: "Error deleting Cloudinary image",
      error: error.message || error
    });
  }
};

// Reply to a user's contact message
exports.replyToContact = async (req, res) => {
  const reqemail = req.user?.email;
  if (reqemail !== process.env.EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { id } = req.params;
  const { reply, replyImageBase64, sendEmailFlag } = req.body;

  if (reply === undefined) {
    return res.status(400).json({ message: "Reply content is required" });
  }

  try {
    const contact = await Contacte.findById(id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    contact.adminReply = reply;

    // Delete old image if a new image is provided or if it is explicitly cleared
    if ((replyImageBase64 || replyImageBase64 === null) && contact.adminReplyImage) {
      const publicId = contact.adminReplyImage.split('/').pop().split('.')[0];
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(`admin_reply_images/${publicId}`);
        } catch (delErr) {
          console.error("Failed to delete old reply image:", delErr);
        }
      }
    }

    // Upload image to Cloudinary if provided
    if (replyImageBase64) {
      try {
        const uploadResult = await cloudinary.uploader.upload(replyImageBase64, {
          folder: "admin_reply_images",
          resource_type: "image",
        });
        contact.adminReplyImage = uploadResult.secure_url;
      } catch (imgErr) {
        console.error("Failed to upload reply image:", imgErr);
      }
    } else if (replyImageBase64 === null) {
      // Clear image only if explicitly requested
      contact.adminReplyImage = "";
    }

    await contact.save();

    // Optionally send an email
    if (sendEmailFlag) {
      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e293b;">Reply to your message</h2>
            <p style="color: #475569;"><strong>Subject:</strong> ${contact.subject || "Your Message"}</p>
            <div style="background: #f8fafc; border-left: 4px solid #0ea5e9; padding: 15px; margin: 15px 0; border-radius: 4px;">
              <p style="color: #1e293b; margin: 0; white-space: pre-wrap;">${reply}</p>
            </div>
            ${contact.adminReplyImage ? `<img src="${contact.adminReplyImage}" style="max-width:100%; border-radius:8px; margin-top:10px;" alt="Reply Image" />` : ""}
            <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">DGT Portfolio Support Team</p>
          </div>
        `;
        await sendEmail(contact.email, "Reply: " + (contact.subject || "Your Message"), emailHtml);
      } catch (emailErr) {
        console.error("Failed to send reply email:", emailErr);
      }
    }

    res.json({ message: "Reply saved successfully", contact });
  } catch (error) {
    console.error("Error replying to contact:", error);
    res.status(500).json({ message: "Failed to save reply", error: error.message });
  }
};

// Manually create payment for a user (admin action)
exports.createPaymentManually = async (req, res) => {
  const reqemail = req.user?.email;
  if (reqemail !== process.env.EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { useremail } = req.body;
  if (!useremail) {
    return res.status(400).json({ message: "User email is required" });
  }

  try {
    let payment = await Payment.findOne({ useremail });
    if (payment) {
      payment.status = "ACTIVE";
      await payment.save();
      return res.json({ message: "Payment updated to ACTIVE", payment });
    }
    payment = await Payment.create({
      useremail,
      status: "ACTIVE",
      paypalOrderId: `ADMIN-GRANT-${Date.now()}`,
      amount: 0
    });
    res.status(201).json({ message: "Payment created successfully", payment });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ message: "Failed to create payment", error: error.message });
  }
};

exports.deletePaymentById = async (req, res) => {
  const reqemail = req.user?.email;
  if (reqemail !== process.env.EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { id } = req.params;
  try {
    const payment = await Payment.findByIdAndDelete(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ message: "Failed to delete payment", error: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  const reqemail = req.user?.email;
  if (reqemail !== process.env.EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { id } = req.params;
  try {
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = payment.status === "ACTIVE" ? "REFUNDED" : "ACTIVE";
    await payment.save();

    res.json({ message: "Payment status updated successfully", payment });
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ message: "Failed to update payment", error: error.message });
  }
};