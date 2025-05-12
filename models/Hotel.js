const mongoose = require("mongoose");

const HotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    city: { type: String, required: true },
    price: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    image: { type: String }
});

module.exports = mongoose.model("Hotel", HotelSchema);
