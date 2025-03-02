import { generate } from "otp-generator";
import otpModel from "./otp.model";

class OTPService {
  private opt = otpModel;

  private async generateOtp(): Promise<String | Error> {
    const otp = generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: true,
      specialChars: false,
    });
    return otp;
  }

  public async saveOtp(userId: string): Promise<string> {
    const otp = await this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otpDocument = await this.opt.create({ userId, otp, expiresAt });

    return otpDocument.otp;
  }

  public async verifyOtp(userId: string, otp: string): Promise<boolean> {
    const otpDoc = await this.opt.findOne({ userId: userId, otp: otp });

    if (!otpDoc) return false;
    if (otpDoc.isVerified) return false;
    if (otpDoc.expiresAt < new Date()) return false;

    otpDoc.isVerified = true;
    await otpDoc.save();
    return true;
  }
}

export default OTPService;
