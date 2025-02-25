import HttpException from "../../exceptions/http.exception";
import profileModel from "../profile/profile.model";
import { Profile } from "../profile/profile.protocol";
import userModel from "./user.model";

class UserService {
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
}

export default UserService;
