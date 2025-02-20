import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import passportMiddleware from "../../middlewares/passport.middleware";
import validationMiddleware from "../../middlewares/validation.middleware";
import GeneralController from "../../protocols/global.controller";
import { uploadProfileAndCoverMiddleware } from "../../services/multers.config";
import AuthService from "./auth.service";
import validate from "./auth.validators";

class AuthController implements GeneralController {
  public path = "/auth";
  public router = Router();
  private authService = new AuthService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.post(
      `${this.path}/sign-up`,
      uploadProfileAndCoverMiddleware,
      validationMiddleware(validate.validateSignUp),
      this.signUp
    );

    this.router.post(
      `${this.path}/verify-account`,
      validationMiddleware(validate.validateVerifyAccount),
      this.verifyAccount
    );

    this.router.post(
      `${this.path}/request-verify-account`,
      validationMiddleware(validate.validateRequestVerifyAccount),
      this.requestAccountVerification
    );

    this.router.delete(
      `${this.path}/delete-account`,
      [authenticatedMiddleware],
      this.deleteAccount
    );

    this.router.post(
      `${this.path}/sign-in`,
      validationMiddleware(validate.validateSignIn),
      this.signIn
    );

    this.router.post(`${this.path}/refresh-token`, this.refreshToken);

    this.router.post(`${this.path}/logout`, [passportMiddleware], this.logout);

    this.router.post(
      `${this.path}/forgot-password`,
      validationMiddleware(validate.validateDeleteAccount),
      this.forgotPassword
    );



    this.router.post(
      `${this.path}/verify-otp`,
      [validationMiddleware(validate.validateOTPCode)],
      this.verifyOTP
    );

    this.router.post(
      `${this.path}/change-password`,
      [
        authenticatedMiddleware,
        validationMiddleware(validate.validateChangePasswordReset),
      ],
      this.changePassword
    );

    this.router.post(`${this.path}/logout`, [passportMiddleware], this.logout);

    this.router.post(
      `${this.path}/setup-mfa`,
      [authenticatedMiddleware],
      this.setupMFA
    );

    this.router.post(
      `${this.path}/verify-mfa`,
      validationMiddleware(validate.validateVerifyMFA),
      [authenticatedMiddleware],
      this.verifyMFA
    );

    this.router.post(
      `${this.path}/reset-mfa`,
      [authenticatedMiddleware],
      this.resetMFA
    );

    this.router.post(
      `${this.path}/request-2fa`,
      [authenticatedMiddleware],
      this.request2FA
    );

    this.router.post(
      `${this.path}/enable-2fa`,
      [authenticatedMiddleware],
      this.enable2FA
    );

  }

  private signUp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {

      const {
        firstName,
        lastName,
        otherName,
        email,
        mobileNumber,
        password,
        fcmToken,
        companyName,
        designation,
      } = req.body;
      const f = req.files
      const profilePhoto = req.files?.['profilePhoto']?.[0];
      const coverPhoto = req.files?.['coverPhoto']?.[0];

      const { accessToken, refreshToken } = await this.authService.signUp(
        firstName,
        lastName,
        otherName,
        email,
        mobileNumber,
        password,
        fcmToken,
        companyName,
        designation, profilePhoto, coverPhoto
      );

      res.status(201).json({
        status: "success",
        message: "signed up successfully. Please check your email for verification",
        payload: { accessToken, refreshToken },
      });
    } catch (error: any) {
      console.log(`${error}`);
      next(new HttpException(400, "error", error.message));
    }
  };

  private verifyAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { email, otp } = req.body;
      await this.authService.verifyAccountOTP(email, otp);

      return res
        .status(201)
        .json({
          status: "success",
          message: "Account verified successfully",
        });

    } catch (error: any) {
      next(error);
    }
  };

  private requestAccountVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { email } = req.body;
      const error = await this.authService.sendAccountVerificationOTP(email);

      if (error && error !== "" && error === undefined) {
        return res
          .status(201)
          .json({ statusCode: 400, status: "error", message: error });
      } else {
        return res
          .status(201)
          .json({
            status: "success",
            message: "Account verification instructions successfully",
          });
      }
    } catch (error: any) {
      console.log(`requestAccountVerification### ${error}`);
      next(new HttpException(400, "error", error.message));
    }
  };

  private deleteAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      await this.authService.deleteAccount(user);

      return res
        .status(201)
        .json({ status: "success", message: "Account deleted successfully" });
    } catch (error: any) {
      console.log(`${error}`);
      next(new HttpException(400, "error", error.message));
    }
  };

  private signIn = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { email, password, otpCode, mfaCode } = req.body;
      const { accessToken, refreshToken } = await this.authService.signIn(
        email,
        password, otpCode, mfaCode
      );
      res.status(200).json({
        status: "success",
        message: "sign in successfully",
        payload: { accessToken, refreshToken },
      });
    } catch (error: any) {
      next(new HttpException(400, "error", error.message));
    }
  };

  private forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { email } = req.body;
      await this.authService.forgotPassword(email);

      return res.status(201).json({ status: "success", message: "OTP for resetting password sent successfully" });

    } catch (error) {
      next(error);
    }
  };

  private verifyOTP = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { email, code } = req.body;
      const { accessToken, refreshToken } = await this.authService.verifyOTP(email, code);



      return res.status(201).json({
        status: "success",
        message: "Password OTP verified successfully",
        payload: {
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      });
    } catch (error: any) {
      console.log(`${error}`);
      next(new HttpException(400, "error", error.message));
    }
  };

  private changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { email, newPassword } = req.body;
      const result = await this.authService.changePassword(email, newPassword);
      if (result instanceof Error) {
        return res.status(400).json({
          statusCode: 400,
          status: "error",
          message: result.message,
        });
      } else {
        const { accessToken, refreshToken } = result;
        return res.status(201).json({
          status: "success",
          message: "password changed",
          payload: { accessToken, refreshToken },
        });
      }
    } catch (error: any) {
      console.log(`${error}`);
      next(new HttpException(400, "error", error.message));
    }
  };

  private refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new HttpException(400, "error", "Refresh token is required");
      }
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await this.authService.refreshTokens(refreshToken);
      // todo send email notification
      res.status(200).json({
        statsu: "success",
        message: "token reset",
        payload: { newAccessToken, newRefreshToken },
      });
    } catch (error: any) {
      next(new HttpException(403, "error", error.message));
    }
  };

  private logout = (
    req: Request,
    res: Response,
    next: NextFunction
  ): Response | void => {

  };

  private request2FA = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      await this.authService.request2FA(user);

      return res.status(201).json({
        status: "success",
        message: "2FA instructions sent for verification",
      });
    } catch (error) {
      next(error);
    }
  };

  private enable2FA = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      const { otpCode } = req.body
      await this.authService.enable2FA(user, otpCode);

      return res.status(201).json({
        status: "success",
        message: "Two Factor Authentication (2FA) Enabled",
      });
    } catch (error) {
      next(error);
    }
  };

  private setupMFA = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) return res.status(301).json({ message: "user not found" });
      const data = await this.authService.createMFA(user);
      const secret = data[0];
      const qrImageUrl = data[1];
      return res.status(200).json({ secret: secret.base32, qrUrl: qrImageUrl });
    } catch (error) {
      next(error);
    }
  };

  private verifyMFA = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { code } = req.body;
      const user = req.user;

      if (!user) {
        throw new HttpException(401, "fail", "User not authenticated");
      }

      const token = await this.authService.verifyMFA(user, code);
      return res
        .status(200)
        .json({ message: "2FA verified successfully", token: token });
    } catch (error) {
      next(error);
    }
  };

  private resetMFA = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) {
        return next(new HttpException(401, "error", "User not authenticated"));
      }

      const result = await this.authService.resetMFA(user);

      if (result) {
        res.status(200).json({
          message: "Multi-Factor Authentication has been reset successfully",
        });
      } else {
        next(new HttpException(500, "error", "Failed to reset 2FA"));
      }
    } catch (error) {
      next(error);
    }
  };

}

export default AuthController;
