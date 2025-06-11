const express = require("express");
require("dotenv").config();

const { connectToMongoDB } = require("./connection");

const userRouter = require("./routes/user.route");
const projectRouter = require("./routes/project.route");
const applicationRouter = require("./routes/application.route");

const { authenticateUser } = require("./middlewares/auth.middleware");

const app = express();

// DB Connection
connectToMongoDB(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error", err));

// Middlewares
app.use(express.json());

// Router Registrations
app.use("/api/users", userRouter);
app.use("/api/projects", authenticateUser, projectRouter);
app.use("/api/applications", authenticateUser, applicationRouter);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
