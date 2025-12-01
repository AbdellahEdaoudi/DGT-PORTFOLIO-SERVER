// controller/general.controller.js
const User = require("../models/User");
const Links = require("../models/Links");

exports.getAllData = async (req, res) => {
  try {
    const email = req.user?.email;

    const findemail = await User.findOne({ email });
    if (!findemail) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    const [users, links] = await Promise.all([
      User.findOne({ email })
        .select("-updatedAt -createdAt -__v")
        .lean(),

      Links.find({ useremail: email })
        .select("-createdAt -updatedAt -__v")
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      users,
      links,
    });
  } catch (error) {
    console.error("Error in getAllData:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
