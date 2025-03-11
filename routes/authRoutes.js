const express = require("express");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

const router = express.Router();

// Temporary store for secrets (Replace with DB in production)
const userSecrets = {};

// 📌 Generate QR Code for Google Authenticator
router.get("/generate-qr", (req, res) => {
  const { userId } = req.query; // Assume userId is passed in query params

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  // Generate a new secret
  const secret = speakeasy.generateSecret({ length: 20 });

  // Store the secret (In production, save it in the database)
  userSecrets[userId] = secret.base32;

  // Generate QR code for Google Authenticator
  QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
    if (err) {
      return res.status(500).json({ error: "QR Code generation failed" });
    }

    res.json({
      qrCodeUrl: data_url, // Send QR Code Image URL
      secret: secret.base32, // Send secret (For development purposes)
    });
  });
});

// 📌 Verify OTP from User
router.post("/verify-otp", (req, res) => {
  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ error: "User ID and OTP are required" });
  }

  const secret = userSecrets[userId];

  if (!secret) {
    return res.status(400).json({ error: "No secret found for user" });
  }

  // Verify OTP
  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1, // Allows for slight time variations
  });

  if (verified) {
    res.json({ success: true, message: "OTP verified successfully!" });
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP" });
  }
});

module.exports = router;
