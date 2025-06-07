const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/authMiddleware");

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/avatars";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use userId-timestamp-originalname
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Stronger file type check
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.jpeg', '.jpg', '.png', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/jpg"
  ];
  if (allowedExts.includes(ext) && allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Images only! (jpeg, jpg, png, gif)"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
});

// Avatar upload endpoint
router.post("/", protect, (req, res, next) => {
  upload.single("avatar")(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    // Build URL for avatar (absolute or relative as needed)
    const fileUrl = `/uploads/avatars/${req.file.filename}`;
    res.status(200).json({
      message: "File uploaded successfully",
      fileUrl,
    });
  });
});

module.exports = router;