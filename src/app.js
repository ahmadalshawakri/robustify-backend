const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// Import routes...
const AuthRoutes = require("./routes/auth.route");
const AdminRoutes = require("./routes/admin.route");
const OrderRoutes = require("./routes/order.route");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get("/health", (req, res) => {
  res.json("Hello World");
});

// Routes
app.use("/api/auth", AuthRoutes);
app.use("/api/admin/users", AdminRoutes);
app.use("/api/orders", OrderRoutes);

// Sync database models
require("./models");

module.exports = app;
