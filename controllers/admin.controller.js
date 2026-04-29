// controller/general.controller.js
const User = require("../models/User");
const Links = require("../models/Links");
const Contact = require("../models/Contacte");
const Contacte = require("../models/Contacte");
const Subscription = require("../models/Subscription");
const Promocode = require("../models/Promocode");

const { sendEmail, trialExpiredTemplate } = require("../utils/emailService");
const cloudinary = require("../utils/cloudinary");


exports.GetDataApp = async (req, res) => {
  try {
    const email = req.user?.email;
    if (email !== process.env.EMAIL) {
      return res.json({ success: false, message: "data count 0" });
    }
    const [users, links, contacts, subscription, promoCodes] = await Promise.all([
      User.find().collation({ locale: "en", strength: 1 }).sort({ fullname: 1 })
        .select("about fullname email username country category createdAt urlimage theme").lean(),
      Links.find().select("-__v").lean(),
      Contact.find().select("-__v").lean(),
      Subscription.find().select("-__v").lean(),
      Promocode.find().select("-__v").lean(),
    ]);
    res.status(200).json({
      success: true,
      users,
      links,
      contacts,
      subscription,
      promoCodes
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

// Delete a promo code by ID
exports.deletePromoById = async (req, res) => {
  const reqemail = req.user?.email;
  if (reqemail !== process.env.EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const deletedPromo = await Promocode.findByIdAndDelete(req.params.id);
    if (!deletedPromo) {
      return res.status(404).json({ message: 'Promo code not found' });
    }
    res.json({ message: 'Promo code deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting promo code', error: error.message });
  }
};

// Send Bulk Trial Expired Emails
exports.sendTrialExpiredEmails = async (req, res) => {
  const reqemail = req.user?.email;
  if (reqemail !== process.env.EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { users } = req.body; // Expect array of user objects { email, username/fullname }

  if (!users || !Array.isArray(users)) {
    return res.status(400).json({ message: "Invalid users list" });
  }

  try {
    let count = 0;
    for (const u of users) {
      if (!u.email) continue;
      const emailContent = trialExpiredTemplate(u.fullname || u.username);
      await sendEmail(u.email, "Your Free Trial Has Ended - Special Gift Inside!", emailContent);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to prevent rate limiting
      count++;
    }
    res.json({ message: `Emails sent to ${count} users successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
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