interface OTP {
  userId: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
  isVerified?: boolean;
}

interface OTPOptions {
  digits?: boolean;
  lowerCaseAlphabets?: boolean;
  upperCaseAlphabets?: boolean;
  specialChars?: boolean;
}

export { OTP, OTPOptions };
