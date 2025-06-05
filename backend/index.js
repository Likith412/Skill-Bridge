const express = require("express");
require("dotenv").config();


const connectDB = require("./utils/db");
connectDB();

const app = express();
app.use(express.json());


const User = require("./model/user.model");

app.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api", (req, res) => {
  return res.status(200).json({ message: "Hello World" });
});

app.get("/api/users", (req, res) => {
  return res.status(200).json({ message: "fetched users sucessfully" });
});

app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));