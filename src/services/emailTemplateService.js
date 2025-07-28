class EmailTemplateService {
  static generateVerificationEmailTemplate(firstName, otp) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; margin: 0;">CareDevi</h1>
          <p style="color: #666; margin: 5px 0;">Healthcare Management System</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h2 style="color: white; margin: 0 0 10px 0;">Email Verification</h2>
          <p style="color: #e8f5e8; margin: 0;">Verify your account to get started</p>
        </div>
        
        <div style="padding: 0 20px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${
            firstName || "there"
          },</p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Thank you for registering with CareDevi! Please use the following verification code to complete your account setup:
          </p>
          
          <div style="background-color: #f8f9fa; border: 2px dashed #4CAF50; padding: 30px; text-align: center; margin: 30px 0; border-radius: 10px;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your verification code:</p>
            <h1 style="color: #4CAF50; font-size: 36px; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</h1>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>⏰ Important:</strong> This code will expire in 10 minutes for security reasons.
            </p>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            If you didn't create an account with CareDevi, please ignore this email and no action is required.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;">
        
        <div style="text-align: center; padding: 20px;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            This is an automated message from CareDevi Healthcare Management System.
          </p>
          <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
  }

  static generatePasswordResetEmailTemplate(firstName, otp) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #FF6B6B; margin: 0;">CareDevi</h1>
          <p style="color: #666; margin: 5px 0;">Healthcare Management System</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #FF6B6B 0%, #ee5a52 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h2 style="color: white; margin: 0 0 10px 0;">Password Reset</h2>
          <p style="color: #ffe8e8; margin: 0;">Secure your account with a new password</p>
        </div>
        
        <div style="padding: 0 20px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${
            firstName || "there"
          },</p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            We received a request to reset your CareDevi account password. Use the following code to proceed:
          </p>
          
          <div style="background-color: #f8f9fa; border: 2px dashed #FF6B6B; padding: 30px; text-align: center; margin: 30px 0; border-radius: 10px;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your password reset code:</p>
            <h1 style="color: #FF6B6B; font-size: 36px; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</h1>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>⏰ Important:</strong> This code will expire in 15 minutes for security reasons.
            </p>
          </div>
          
          <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="color: #721c24; margin: 0; font-size: 14px;">
              <strong>🔒 Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;">
        
        <div style="text-align: center; padding: 20px;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            This is an automated message from CareDevi Healthcare Management System.
          </p>
          <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
  }
}

module.exports = EmailTemplateService;
