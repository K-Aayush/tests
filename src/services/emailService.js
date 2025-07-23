const nodemailer = require("nodemailer");
const crypto = require("crypto");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  generateOTP(_length = 6) {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendVerificationOTP(email, otp, firstName) {
    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@caredevi.com",
      to: email,
      subject: "Email Verification - OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p>Hi ${firstName},</p>
          <p>Thank you for registering! Please use the following OTP code to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4CAF50; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error("Email sending error:", error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetOTP(email, otp, firstName) {
    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@yourapp.com",
      to: email,
      subject: "Password Reset - OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Password Reset</h2>
          <p>Hi ${firstName},</p>
          <p>You requested to reset your password. Please use the following OTP code:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #FF6B6B; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error("Email sending error:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
