const Links = require('../models/Links');


// Create a new link
exports.createLink = async (req, res) => {
  const reqemail = req.user?.email;
  try {
    req.body.useremail = reqemail;
    req.body.namelink = req.body.namelink?.substring(0, 100);
    req.body.link = req.body.link?.substring(0, 100);

    const count = await Links.countDocuments({ useremail: reqemail });
    if (count >= 10) {
      return res.status(400).json({ success: false, message: "Maximum 10 links allowed" });
    }

    const newLink = new Links(req.body);
    await newLink.save();
    res.status(201).json({ message: 'Link created successfully', data: newLink });
  } catch (error) {
    res.status(500).json({ message: 'Error creating link', error: error.message });
  }
};

// Update a link by ID
exports.updateLink = async (req, res) => {
  const reqemail = req.user?.email;
  try {
    const linkToUpdate = await Links.findById(req.params.id);
    if (!linkToUpdate) {
      return res.status(404).json({ message: 'Link not found' });
    }
    if (linkToUpdate.useremail !== reqemail) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    req.body.useremail = reqemail;
    req.body.namelink = req.body.namelink?.substring(0, 100);
    req.body.link = req.body.link?.substring(0, 100);
    
    const updatedLink = await Links.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Link updated successfully', data: updatedLink });
  } catch (error) {
    res.status(500).json({ message: 'Error updating link', error: error.message });
  }
};

// Delete a link by ID
exports.deleteLink = async (req, res) => {
  const reqemail = req.user?.email;
  try {
    const linkToDelete = await Links.findById(req.params.id);
    if (!linkToDelete) {
      return res.status(404).json({ message: 'Link not found' });
    }
    if (linkToDelete.useremail !== reqemail) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    await Links.findByIdAndDelete(req.params.id);
    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting link', error: error.message });
  }
};
