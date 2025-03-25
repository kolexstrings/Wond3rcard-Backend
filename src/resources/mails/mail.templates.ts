const MailTemplates = {
  welcomeTemplate: /*html*/ `
  <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to WOND3R CARD</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h2 {
            color: #4b32d0;
        }
        p {
            font-size: 16px;
            color: #555;
            line-height: 1.6;
        }
        .cta-button {
            display: inline-block;
            background-color: #4b32d0;
            color: #ffffff;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Welcome, {{userName}}!</h2>
        <p>Thank you for signing up! We're thrilled to have you on board.</p>
        <p>Start exploring all the benefits of WOND3R CARD and enjoy an amazing experience.</p>
        <a href="{{dashboardLink}}" class="cta-button">Go to Dashboard</a>
        <p class="footer">If you have any questions, feel free to <a href="mailto:support@wond3rcard.com">contact us</a>.</p>
        <p class="footer">— The WOND3R CARD Team</p>
    </div>
</body>
</html>

`,

  subscriptionConfirmation: /*html*/ `<!DOCTYPE html>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Upgrade Successful!</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h2 {
            color: #4b32d0;
        }
        p {
            font-size: 16px;
            color: #555;
            line-height: 1.6;
        }
        .cta-button {
            display: inline-block;
            background-color: #4b32d0;
            color: #ffffff;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Congratulations, {{emailData.name}}! 🎉</h2>
        <p>Your subscription has been successfully upgraded to <strong>{{emailData.plan}}</strong>!</p>
        <p>You now have full access to all the {{emailData.plan}} features of WOND3R CARD.</p>
        <p>Your new plan is valid until <strong>{{expiresAt}}</strong>.</p>
        <a href="{{dashboardLink}}" class="cta-button">Go to Dashboard</a>
        <p class="footer">If you have any questions, feel free to <a href="mailto:support@wond3rcard.com">contact us</a>.</p>
        <p class="footer">— The WOND3R CARD Team</p>
    </div>
</body>
</html>
`,

  physicalCardOrderConfirmation: /*html*/ `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Card Order Successful!</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h2 {
            color: #4b32d0;
        }
        p {
            font-size: 16px;
            color: #555;
            line-height: 1.6;
        }
        .cta-button {
            display: inline-block;
            background-color: #4b32d0;
            color: #ffffff;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Thank You for Your Order, {{emailData.name}}! 🎉</h2>
        <p>Your physical card order has been successfully placed.</p>
        <p>Order ID: <strong>{{emailData.orderId}}</strong></p>
        <p>Your card will be shipped to:</p>
        <p><strong>{{emailData.shippingAddress}}</strong></p>
        <p>Estimated delivery date: <strong>{{emailData.estimatedDelivery}}</strong></p>
        <a href="{{trackingLink}}" class="cta-button">Track Your Order</a>
        <p class="footer">If you have any questions, feel free to <a href="mailto:support@wond3rcard.com">contact us</a>.</p>
        <p class="footer">— The WOND3R CARD Team</p>
    </div>
</body>
</html>`,

  setup2faConfirmation: /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>2FA Setup Confirmation</title>
</head>
<body>
  <h2>Hello, {{userName}}!</h2>
  <p>You have successfully enabled Two-Factor Authentication (2FA) for your account.</p>
  <p>If you didn’t perform this action, please contact our support team immediately.</p>
</body>
</html>
`,

  setupmfaConfrimation: /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MFA Setup Successful</title>
</head>
<body>
  <h2>Hello, {{userName}}!</h2>
  <p>You’ve successfully set up Multi-Factor Authentication (MFA) on your account.</p>
  <p>If this wasn’t you, please contact support immediately.</p>
</body>
</html>
`,
  passwordResetRequest: /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Password Reset Request</title>
</head>
<body>
  <h2>Hello, {{userName}}!</h2>
  <p>We received a request to reset your password.</p>
  <p>Your OTP code is:</p>
  <h3>{{otpCode}}</h3>
  <p><a href="{{resetPasswordLink}}">Or click here to reset your password</a>.</p>
  <p>If you didn’t request a password reset, please ignore this email or contact support.</p>
</body>
</html>
`,

  otpVerification: /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your OTP Code</title>
</head>
<body>
  <h2>Hello, {{userName}}!</h2>
  <p>Your OTP code is:</p>
  <h3>{{otpCode}}</h3>
  <p>This code is valid for 10 minutes.</p>
  <p>or click the link below to verify your account:</p>
  <a href="{{verifyLink}}">Verify Account</a>
  <p>If you didn't request this code, please ignore this email.</p>
</body>
</html>
`,

  signUpWelcome: /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to Our Platform!</title>
</head>
<body>
  <h2>Welcome, {{userName}}!</h2>
  <p>Thank you for signing up. We’re thrilled to have you on board!</p>
  <p><a href="{{verifyLink}}">Verify your email address</a> to start using your account.</p>
  <p>If you have any questions, feel free to reach out to our support team.</p>
</body>
</html>
`,
  signInNotification: /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sign In Notification</title>
</head>
<body>
  <h2>Hello, {{userName}}!</h2>
  <p>We noticed a new sign-in to your account on {{date}} from {{location}}.</p>
  <p>If this was you, no further action is required.</p>
  <p>If this wasn’t you, please <a href="{{resetPasswordLink}}">reset your password</a> immediately.</p>
</body>
</html>
`,

  accountAlreadyVerified: /*html*/ `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Verified</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: auto; }
        h1 { color: #4CAF50; }
        p { color: #333; }
        .btn { display: inline-block; padding: 10px 20px; margin-top: 20px; text-decoration: none; color: white; background-color: #4CAF50; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Account Verified Successfully!</h1>
        <p>Thank you for verifying your account, {{userEmail}}. You can now log in and access your account.</p>
        <a href="{{loginUrl}}" class="btn">Log In</a>
    </div>
</body>
</html>
`,

  passwordChangedSuccessfully: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Password Changed Successfully</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    h2 {
      color: #4CAF50;
    }
    p {
      margin: 10px 0;
    }
    a {
      color: #4CAF50;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h2>Hello, {{userName}}!</h2>
  <p>This is to confirm that your password was changed successfully.</p>
  <p>If you made this change, you can safely ignore this email.</p>
  <p>If you did not request this change, please contact our support team immediately to secure your account.</p>
  <p>Thank you for using our service!</p>
  <p>
    Best regards, <br>
    The {{companyName}} Team
  </p>
  <p>
    <small>If you need further assistance, <a href="{{supportLink}}">contact support</a>.</small>
  </p>
</body>
</html>
`,

  accountVerified: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Account Verified Successfully</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    h2 {
      color: #4CAF50;
    }
    p {
      margin: 10px 0;
    }
    a {
      color: #4CAF50;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h2>Hello, {{userName}}!</h2>
  <p>We are pleased to inform you that your account has been successfully verified.</p>
  <p>You can now log in and enjoy all the features of our service.</p>
  <p>If you did not initiate this verification, please contact our support team immediately to secure your account.</p>
  <p>Thank you for choosing {{companyName}}!</p>
  <p>
    Best regards, <br>
    The {{companyName}} Team
  </p>
  <p>
    <small>If you need further assistance, <a href="{{supportLink}}">contact support</a>.</small>
  </p>
</body>
</html>
`,
  githubMailMergeNotification: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Merge Event Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f9;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #4caf50;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 20px;
    }
    .content p {
      font-size: 16px;
      color: #333333;
      margin: 8px 0;
    }
    .content .label {
      font-weight: bold;
      color: #555555;
    }
    .footer {
      background-color: #eeeeee;
      text-align: center;
      padding: 10px;
      font-size: 14px;
      color: #777777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Merge Event Notification</h1>
    </div>
    <div class="content">
      <p><span class="label">Repository:</span> {{repository}}</p>
      <p><span class="label">Branch:</span>  {{branch}}</p>
      <p><span class="label">Committer:</span>  {{commiter}}</p>
      <p><span class="label">Commit Message:</span>  {{commit}}</p>
      <p><span class="label">Merge Event:</span> {{event}}</p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`,

  request2FA: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enable 2FA - OTP Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        .email-header {
            background-color: #007bff;
            color: #ffffff;
            padding: 20px;
            text-align: center;
            font-size: 24px;
        }
        .email-body {
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .email-body p {
            margin: 10px 0;
        }
        .otp-code {
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            background: #f9f9f9;
            padding: 10px;
            margin: 20px 0;
            border: 1px dashed #007bff;
            color: #007bff;
        }
        .email-footer {
            background: #f9f9f9;
            text-align: center;
            padding: 15px;
            font-size: 12px;
            color: #666;
        }
        .email-footer a {
            color: #007bff;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            Wond3r Card
        </div>
        <div class="email-body">
            <p>Dear {{name}},</p>
            <p>Thank you for choosing to secure your Wond3r Card account by enabling Two-Factor Authentication (2FA). Please use the One-Time Password (OTP) below to complete the setup:</p>
            <div class="otp-code">{{otpCode}}</div>
            <p><strong>Note:</strong> This OTP is valid for the next <strong>10 minutes</strong>. Please do not share it with anyone.</p>
            <p>To enable 2FA:</p>
            <ol>
                <li>Enter the OTP code on the 2FA setup page.</li>
                <li>Follow the instructions to complete the process.</li>
            </ol>
            <p>If you did not request this, please contact our support team immediately at <a href="mailto:support@wond3rcard.com">support@wond3rcard.com</a> or call us at +1-800-123-4567.</p>
            <p>Thank you for using Wond3r Card to safeguard your account.</p>
        </div>
        <div class="email-footer">
            &copy; 2025 Wond3r Card. All rights reserved.<br>
            <a href="https://www.wond3rcard.com">www.wond3rcard.com</a> | <a href="mailto:support@wond3rcard.com">Contact Support</a>
        </div>
    </div>
</body>
</html>
`,

  enable2FA: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2FA Enabled Successfully</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        .email-header {
            background-color: #28a745;
            color: #ffffff;
            padding: 20px;
            text-align: center;
            font-size: 24px;
        }
        .email-body {
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .email-body p {
            margin: 10px 0;
        }
        .success-message {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            background: #f9f9f9;
            padding: 10px;
            margin: 20px 0;
            border: 1px solid #28a745;
            color: #28a745;
        }
        .email-footer {
            background: #f9f9f9;
            text-align: center;
            padding: 15px;
            font-size: 12px;
            color: #666;
        }
        .email-footer a {
            color: #28a745;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            Wond3r Card
        </div>
        <div class="email-body">
            <p>Dear {{name}},</p>
            <p>We are happy to inform you that Two-Factor Authentication (2FA) has been successfully enabled for your Wond3r Card account. Your account is now more secure.</p>
            <div class="success-message">
                2FA Enabled Successfully!
            </div>
            <p>From now on, every time you log in, you'll be prompted to enter a One-Time Password (OTP) sent to your registered device, ensuring an additional layer of protection for your account.</p>
            <p>If you did not authorize this change or have any questions, please contact our support team immediately at <a href="mailto:support@wond3rcard.com">support@wond3rcard.com</a> or call us at +1-800-123-4567.</p>
            <p>Thank you for trusting Wond3r Card to secure your account.</p>
        </div>
        <div class="email-footer">
            &copy; 2025 Wond3r Card. All rights reserved.<br>
            <a href="https://www.wond3rcard.com">www.wond3rcard.com</a> | <a href="mailto:support@wond3rcard.com">Contact Support</a>
        </div>
    </div>
</body>
</html>
`,

  otpCode: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your 2FA OTP Code</title>
    <style>
        body {
            font-family: 'Verdana', sans-serif;
            background-color: #f2f2f2;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .email-header {
            background-color: #ff5722;
            color: #ffffff;
            text-align: center;
            padding: 20px;
            font-size: 24px;
        }
        .email-body {
            padding: 20px;
            color: #333333;
        }
        .email-body p {
            margin: 15px 0;
        }
        .otp-code {
            display: block;
            font-size: 28px;
            font-weight: bold;
            color: #ff5722;
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            border: 2px dashed #ff5722;
            border-radius: 5px;
            background-color: #fff5f0;
        }
        .instructions {
            margin-top: 20px;
            font-size: 14px;
            color: #666;
        }
        .email-footer {
            text-align: center;
            padding: 15px;
            background: #f9f9f9;
            font-size: 12px;
            color: #888888;
        }
        .email-footer a {
            color: #ff5722;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            Wond3r Card
        </div>
        <div class="email-body">
            <p>Hi {{name}},</p>
            <p>You've requested to enable Two-Factor Authentication (2FA) for your Wond3r Card account. Use the One-Time Password (OTP) below to complete the setup:</p>
            <div class="otp-code">
                {{otpCode}}
            </div>
            <p><strong>Note:</strong> This OTP is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.</p>
            <p class="instructions">
                If you did not request this, please contact our support team immediately at <a href="mailto:support@wond3rcard.com">support@wond3rcard.com</a> or call us at +1-800-123-4567.
            </p>
        </div>
        <div class="email-footer">
            &copy; 2025 Wond3r Card. All rights reserved.<br>
            <a href="https://www.wond3rcard.com">www.wond3rcard.com</a> | <a href="mailto:support@wond3rcard.com">Contact Support</a>
        </div>
    </div>
</body>
</html>
`,

  global2FAEnabled: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>2FA Enabled Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f9f9f9; margin: 0; padding: 0;">
  <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd;">
    <tr style="background-color: #0046be; color: #ffffff;">
      <td style="padding: 20px; text-align: center;">
        <h1>Wond3r Card</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px;">
        <p>Hi {{name}},</p>
        <p>We're enhancing the security of your account. As part of our commitment to safeguarding your data, Two-Factor Authentication (2FA) has been enabled for your account.</p>
        <p>2FA adds an extra layer of security by requiring a second step to verify your identity. To learn more about how to use 2FA, please visit our <a href="{{supportLink}}" style="color: #0046be;">support page</a>.</p>
        <p>If you have any questions or need assistance, feel free to contact us.</p>
        <p>Thank you,<br>The Wond3r Card Team</p>
      </td>
    </tr>
    <tr style="background-color: #f4f4f4; text-align: center;">
      <td style="padding: 10px;">
        <p style="font-size: 12px; color: #555;">Need help? Visit <a href="{{supportLink}}" style="color: #0046be;">Support</a> or contact our team.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`,
};

export default MailTemplates;
