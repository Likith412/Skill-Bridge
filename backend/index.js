const express = require("express");
require("dotenv").config();

const { connectToMongoDB } = require("./connection");
const userRouter = require("./routes/user");
const projectRouter = require("./routes/project");

const app = express();

// DB Connection
connectToMongoDB(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error", err));

// Middlewares
app.use(express.json());

// Router Registrations
app.use("/api/users", userRouter);


// Project Routes
app.use("/api/projects", projectRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
