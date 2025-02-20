import HttpException from "../../exceptions/http.exception";
import profileModel from "../profile/profile.model";
import { Profile } from "../profile/profile.protocol";
import userModel from "./user.model";
import { UserRole, UserStatus, UserType } from "./user.protocol";


class UserService {

  private user = userModel;
  private profile = profileModel;


  public async getProfile(uid: string): Promise<Profile> {
    try {
      const profile = await this.profile.findOne({ uid });

      if (!profile) {
        throw new HttpException(404, "error", "Profile not found");
      }

      return profile;
    } catch (error) {
      throw new HttpException(
        error.status || 500,
        "error",
        error.message || "Could not retrieve user's profile"
      );
    }
  }

  public async changeUserRole(userId: string, role: UserRole): Promise<void> {
    try {
      const user = await this.user.findById(userId);
      if (!user) {
        throw new HttpException(404, "error", `User not found`);
      }
      user.userRole = role;
      await user.save();
    } catch (error: any) {
      throw new HttpException(500, "error", `Could not change user role: ${error.message || error}`);
    }
  }

  public async changeUserType(userId: string, type: UserType): Promise<void> {
    try {
      const user = await this.user.findById(userId);
      if (!user) {
        throw new HttpException(404, "error", `User not found`);
      }
      user.userType = type;
      await user.save();
    } catch (error: any) {
      throw new HttpException(500, "error", `Could not change user type: ${error.message || error}`);
    }
  }

  public async changeUserStatus(userId: string, status: UserStatus): Promise<void> {
    try {
      const user = await this.user.findById(userId);
      if (!user) {
        throw new HttpException(404, "error", `User not found`);
      }
      user.userStatus = status;
      await user.save();
    } catch (error: any) {
      throw new HttpException(500, "error", `Could not change user status: ${error.message || error}`);
    }
  }

}

export default UserService;
