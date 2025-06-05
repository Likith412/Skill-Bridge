const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.get("/api", (req, res) => {
  return res.status(200).json({ message: "Hello World" });
});


app.get("/api/users", (req, res) => {
  return res.status(200).json({ message: "fetched users sucessfully" });
});


app.listen(PORT, () => {
  console.log(`Server Running at http://localhost:${PORT}`);
});
app.get("/", (req, res) => {
  res.send("Backend server is running!");
});