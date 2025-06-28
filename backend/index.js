const express = require("express");
const cors = require("cors");

require("dotenv").config();

const { connectToMongoDB } = require("./connection");

const userRouter = require("./routes/user.route");
const projectRouter = require("./routes/project.route");
const applicationRouter = require("./routes/application.route");
const reviewRouter = require("./routes/review.route");

const { authenticateUser } = require("./middlewares/auth.middleware");

const app = express();

// DB Connection
connectToMongoDB(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error", err));

// Middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Router Registrations
app.use("/api/users", userRouter);
app.use("/api/projects", authenticateUser, projectRouter);
app.use("/api/applications", authenticateUser, applicationRouter);
app.use("/api/reviews", authenticateUser, reviewRouter);

// Protected route
app.get("/api/protected", authenticateUser, (req, res) => {
  res.status(200).json({ message: "authorised", user: req.user });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
