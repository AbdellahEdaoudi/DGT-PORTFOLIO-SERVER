const mongoose = require("mongoose");

const PromoCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    }
},{timestamps:true});

module.exports = mongoose.models.PromoCode || mongoose.model("PromoCode", PromoCodeSchema);
