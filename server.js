const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
require("dotenv").config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("mongo dziala"))
    .catch((err) => console.error("mongfo nie dziala:", err));

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);

app.listen(5000, () => console.log("dziala na porcie:1111"));

