const multer = require("multer");
const path = require("path");

// File Storage Configurations
const storage = multer.memoryStorage();

const profileFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const resumeFileFilter = (req, file, cb) => {
  const allowedType = "application/pdf";
  if (file.mimetype === allowedType) {
    cb(null, true); // Accept file
  } else {
    cb(null, false); // Reject file
  }
};

// Middleware that adds file to req object.
const profileUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: profileFileFilter,
});

const resumeUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: resumeFileFilter,
});

module.exports = { profileUpload, resumeUpload };
