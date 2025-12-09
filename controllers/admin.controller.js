// controller/general.controller.js
const User = require("../models/User");
const Links = require("../models/Links");
const Contact = require("../models/Contacte");
const Contacte = require("../models/Contacte");
const Subscription = require("../models/Subscription");
const Promocode = require("../models/Promocode");
const { sendEmail, trialExpiredTemplate } = require("../utils/emailService");


exports.GetDataApp = async (req, res) => {
  try {
    const email = req.user?.email;
    if (email !== process.env.EMAIL) {
      return res.json({ success: false, message: "data count 0" });
    }
    const [users, links, contacts, subscription, promoCodes] = await Promise.all([
      User.find().collation({ locale: "en", strength: 1 }).sort({ fullname: 1 })
        .select(" fullname email username country category createdAt urlimage").lean(),
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

// 🟢 Delete user by ID
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
    const deletedContact = await Contacte.findByIdAndDelete(req.params.id);
    if (!deletedContact) {
      return res.status(404).json({ message: "Contact not found" });
    }
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

// Get Expired Trial Users (Created > 7 days ago and no active subscription)
exports.getExpiredTrialUsers = async (req, res) => {
  const reqemail = req.user?.email;
  if (reqemail !== process.env.EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find users older than 7 days
    const users = await User.find({ createdAt: { $lt: sevenDaysAgo } })
      .select('fullname email username createdAt urlimage')
      .lean();

    // Filter those without active subscription
    const expiredUsers = [];
    const whitelist = [
      "adam.carter.dev@gmail.com",
      "soondiss8@gmail.com",
      "dgt.portfolio.ma@gmail.com"
    ];

    for (const user of users) {
      if (whitelist.includes(user.email)) continue;

      const subscription = await Subscription.findOne({ userEmail: user.email });
      if (!subscription || subscription.status !== 'ACTIVE') {
        expiredUsers.push(user);
      }
    }

    res.json(expiredUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      count++;
    }
    res.json({ message: `Emails sent to ${count} users successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};