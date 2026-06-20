const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");



const RegistrationOtp = require("../models/RegistrationOtp");

const OTP_EXPIRY_MINUTES = Number(process.env.REGISTRATION_OTP_EXPIRY_MINUTES || 5);
const OTP_RESEND_COOLDOWN_SECONDS = Number(
  process.env.REGISTRATION_OTP_RESEND_COOLDOWN_SECONDS || 60,
);
const OTP_MAX_RESENDS = Number(process.env.REGISTRATION_OTP_MAX_RESENDS || 5);
const OTP_RESEND_WINDOW_MINUTES = Number(
  process.env.REGISTRATION_OTP_RESEND_WINDOW_MINUTES || 15,
);
const OTP_MAX_ATTEMPTS = Number(process.env.REGISTRATION_OTP_MAX_ATTEMPTS || 5);
const REGISTRATION_TOKEN_TTL = process.env.REGISTRATION_TOKEN_TTL || "15m";

const ALLOWED_ROLES = ["Business Owner", "Delivery Agent", "Customer"];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isGmailAddress(email) {
  const normalized = normalizeEmail(email);
  return /^[^\s@]+@gmail\.com$/i.test(normalized);
}



function generateOtpCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function getRegistrationTokenSecret() {
  const secret = process.env.REGISTRATION_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Registration token secret is not configured");
  }
  return secret;
}

function buildOtpEmailHtml(otp, expiryMinutes) {
  return `
    <div style="font-family: Arial, sans-serif; background:#0b0b0b; color:#ffffff; padding:32px;">
      <div style="max-width:560px; margin:0 auto; background:#111111; border:1px solid #27272a; border-radius:24px; padding:32px;">
        <h1 style="margin:0 0 16px; font-size:32px; line-height:1.1;">Logi<span style="color:#7F1D1D;">Track</span></h1>
        <p style="margin:0 0 24px; color:#d4d4d8; font-size:16px;">Use the OTP below to verify your Gmail address and continue registration.</p>
        <div style="background:#1a1a1a; border:1px solid #7F1D1D; border-radius:18px; padding:20px; text-align:center; margin:0 0 24px;">
          <div style="font-size:12px; letter-spacing:0.2em; text-transform:uppercase; color:#a1a1aa; margin-bottom:10px;">One-time passcode</div>
          <div style="font-size:36px; font-weight:700; letter-spacing:0.3em; color:#ffffff;">${otp}</div>
        </div>
        <p style="margin:0; color:#a1a1aa; font-size:14px;">This code expires in ${expiryMinutes} minutes and can be used once.</p>
      </div>
    </div>
  `;
}

async function upsertOtpDocument(email) {
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();
  const otp = generateOtpCode();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const existing = await RegistrationOtp.findOne({ email: normalizedEmail });

  let resendWindowStart = now;
  let resendCount = 1;

  if (existing) {
    const windowStart = existing.resendWindowStart || existing.lastSentAt || existing.createdAt || now;
    const windowAge = now.getTime() - new Date(windowStart).getTime();
    const windowLimitMs = OTP_RESEND_WINDOW_MINUTES * 60 * 1000;

    if (windowAge <= windowLimitMs) {
      resendWindowStart = new Date(windowStart);
      resendCount = (existing.resendCount || 0) + 1;
    } else {
      resendWindowStart = now;
      resendCount = 1;
    }

    if (existing.lastSentAt) {
      const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000;
      const sinceLastSend = now.getTime() - new Date(existing.lastSentAt).getTime();

      if (sinceLastSend < cooldownMs) {
        const retryAfter = Math.ceil((cooldownMs - sinceLastSend) / 1000);
        const error = new Error(`Please wait ${retryAfter}s before requesting another OTP`);
        error.statusCode = 429;
        error.retryAfter = retryAfter;
        throw error;
      }
    }

    if (resendCount > OTP_MAX_RESENDS) {
      const error = new Error("Too many OTP requests. Please try again later.");
      error.statusCode = 429;
      throw error;
    }
  }

  const record = await RegistrationOtp.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        email: normalizedEmail,
        otp: otpHash,
        expiresAt,
        verified: false,
        verifiedAt: null,
        usedAt: null,
        attempts: 0,
        lastSentAt: now,
        resendWindowStart,
        resendCount,
        registrationTokenHash: null,
      },
    },
    { new: true, upsert: true, runValidators: true },
  );

  console.log("Sending OTP to:", normalizedEmail);

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 2525,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
    });

    const result = await transporter.sendMail({
      from: "LogiTrack <logitrack862@gmail.com>",
      to: normalizedEmail,
      subject: "Your LogiTrack verification code",
      html: buildOtpEmailHtml(otp, OTP_EXPIRY_MINUTES),
    });

    console.log("Email result:", result);
  } catch (error) {
    console.error("Brevo Error:", error);
    throw error;
  }

  return {
    email: normalizedEmail,
    expiresAt,
    resendAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    record,
  };
}

async function verifyOtpCode(email, otp) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedOtp = String(otp || "").trim();

  const record = await RegistrationOtp.findOne({ email: normalizedEmail });
  if (!record) {
    const error = new Error("No OTP request found for this email");
    error.statusCode = 404;
    throw error;
  }

  if (record.usedAt) {
    const error = new Error("This OTP has already been used");
    error.statusCode = 400;
    throw error;
  }

  if (record.verified) {
    const error = new Error("This OTP has already been verified");
    error.statusCode = 400;
    throw error;
  }

  if (!record.expiresAt || new Date(record.expiresAt).getTime() < Date.now()) {
    const error = new Error("OTP has expired. Please request a new code.");
    error.statusCode = 400;
    throw error;
  }

  if ((record.attempts || 0) >= OTP_MAX_ATTEMPTS) {
    const error = new Error("Too many invalid attempts. Please request a new OTP.");
    error.statusCode = 429;
    throw error;
  }

  const isMatch = await bcrypt.compare(trimmedOtp, record.otp);
  if (!isMatch) {
    await RegistrationOtp.updateOne(
      { _id: record._id },
      { $inc: { attempts: 1 } },
    );

    const error = new Error("Invalid OTP");
    error.statusCode = 400;
    throw error;
  }

  const registrationToken = jwt.sign(
    { email: normalizedEmail, otpId: record._id.toString() },
    getRegistrationTokenSecret(),
    { expiresIn: REGISTRATION_TOKEN_TTL },
  );

  await RegistrationOtp.updateOne(
    { _id: record._id },
    {
      $set: {
        verified: true,
        verifiedAt: new Date(),
        otp: "",
        attempts: 0,
        registrationTokenHash: await bcrypt.hash(registrationToken, 10),
      },
    },
  );

  return {
    email: normalizedEmail,
    registrationToken,
  };
}

async function completeRegistration({
  registrationToken,
  fullName,
  email,
  password,
  confirmPassword,
  role,
  passwordValidator,
  documents,
}) {
  if (!registrationToken) {
    const error = new Error("OTP verification is required before registration");
    error.statusCode = 403;
    throw error;
  }

  const normalizedEmail = normalizeEmail(email);
  const decoded = jwt.verify(registrationToken, getRegistrationTokenSecret());

  if (normalizeEmail(decoded.email) !== normalizedEmail) {
    const error = new Error("Registration token does not match the email address");
    error.statusCode = 403;
    throw error;
  }

  if (!ALLOWED_ROLES.includes(role)) {
    const error = new Error("Invalid role selected");
    error.statusCode = 400;
    throw error;
  }

  if (!fullName || !String(fullName).trim()) {
    const error = new Error("Full name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!password || !confirmPassword) {
    const error = new Error("Password and confirm password are required");
    error.statusCode = 400;
    throw error;
  }

  if (password !== confirmPassword) {
    const error = new Error("Passwords do not match");
    error.statusCode = 400;
    throw error;
  }

  if (typeof passwordValidator === "function") {
    const passwordError = passwordValidator(password);
    if (passwordError) {
      const error = new Error(passwordError);
      error.statusCode = 400;
      throw error;
    }
  }

  const record = await RegistrationOtp.findOne({ email: normalizedEmail });
  if (!record || !record.verified || record.usedAt) {
    const error = new Error("Email verification is incomplete or expired");
    error.statusCode = 403;
    throw error;
  }

  if (!record.registrationTokenHash) {
    const error = new Error("Registration token has expired. Please verify again.");
    error.statusCode = 403;
    throw error;
  }

  const tokenMatches = await bcrypt.compare(
    registrationToken,
    record.registrationTokenHash,
  );

  if (!tokenMatches) {
    const error = new Error("Registration token is invalid or expired");
    error.statusCode = 403;
    throw error;
  }

  const existingUser = await require("../models/User").findOne({ email: normalizedEmail });
  if (existingUser && existingUser.isActive !== false) {
    const error = new Error("User already exists");
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await require("../models/User").create({
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,

    status:
      role === "Customer"
        ? "approved"
        : "pending",

    documents: {
      aadhaar: {
        path: documents?.aadhaar || "",
      },

      drivingLicense: {
        path: documents?.drivingLicense || "",
      },

      gstCertificate: {
        path: documents?.gstCertificate || "",
      },

      shopLicense: {
        path: documents?.shopLicense || "",
      },
        },
  });

  
  await RegistrationOtp.updateOne(
    { _id: record._id },
    {
      $set: {
        usedAt: new Date(),
        registrationTokenHash: null,
        verified: false,
      },
    },
  );

  return user;
}

module.exports = {
  isGmailAddress,
  normalizeEmail,
  upsertOtpDocument,
  verifyOtpCode,
  completeRegistration,
};