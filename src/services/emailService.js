const nodemailer = require("nodemailer");
const crypto = require("crypto");
const EmailTemplateService = require("./emailTemplateService");

class EmailService {
  constructor() {
    this.defaultFrom = process.env.SMTP_FROM || "noreply@caredevi.com";

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      defaults: {
        from: this.defaultFrom,
      },
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
      from: this.defaultFrom,
      to: email,
      subject: "Email Verification - OTP Code",
      html: EmailTemplateService.generateVerificationEmailTemplate(
        firstName,
        otp
      ),
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
      from: this.defaultFrom,
      to: email,
      subject: "Password Reset - OTP Code",
      html: EmailTemplateService.generatePasswordResetEmailTemplate(
        firstName,
        otp
      ),
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
