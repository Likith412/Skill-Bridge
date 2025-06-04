const express = require("express");
require("dotenv").config();

const app = express();

app.use(express.json());

app.get("/api", (req, res) => {
  return res.status(200).json({ message: "Hello World" });
});


app.get("/api/users", (req, res) => {
  return res.status(200).json({ message: "fetched users sucessfully" });
});


app.listen(process.env.PORT, () => {
  console.log(`Server Running at http://localhost:${process.env.PORT}`);
});
