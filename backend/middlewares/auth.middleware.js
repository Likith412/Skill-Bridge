const jwt = require("jsonwebtoken");
const User = require("../models/user.model");



async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not Authenticated" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const dbUser = await User.findById(decoded._id);

    if (!dbUser) {
      return res.status(401).json({ message: "Not Authenticated" });
    }

    // 🚫 Block check — only for non-admins
    if (dbUser.isBlocked && dbUser.role !== "admin") {
      return res.status(403).json({ message: "Your account is blocked. Access denied." });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: "Not Authenticated" });
  }
}

module.exports = authenticateUser;

function authorizeUserRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not Authorized" });
    }
    next();
  };
}

module.exports = { authenticateUser, authorizeUserRoles };
