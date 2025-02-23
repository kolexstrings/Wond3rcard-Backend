import { exec } from "child_process";
import fs from "fs";
import { promisify } from "util";
import path from "path";
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
import HttpException from "../../exceptions/http.exception";
import MailTemplates from "../mails/mail.templates";
import NodeMailerService from "../mails/nodemailer.service";
import userModel from "../user/user.model";
import { User, UserStatus } from "../user/user.protocol";

class AdminService {
  private user = userModel;
  private mailer = new NodeMailerService();

  public async getAllUsers(
    page: number = 1,
    limit: number = 10
  ): Promise<{ users: User[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        userModel.find().skip(skip).limit(limit),
        userModel.countDocuments(),
      ]);

      return { users, total };
    } catch (error) {
      throw new HttpException(500, "failed", "Unable to retrieve users");
    }
  }

  /**
   * Fetch a user by ID
   */
  public async getUserById(userId: string): Promise<User> {
    try {
      const user = await this.user.findById(userId);
      if (!user) {
        throw new HttpException(404, "user_not_found", "User not found");
      }
      return user;
    } catch (error) {
      throw new HttpException(
        500,
        "fetch_user_failed",
        `Failed to fetch user: ${error}`
      );
    }
  }

  /**
   * Update user details (email, name, role, etc.)
   */
  public async updateUser(
    userId: string,
    updateData: Partial<User>
  ): Promise<User> {
    try {
      const updatedUser = await this.user.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      );

      if (!updatedUser) {
        throw new HttpException(404, "user_not_found", "User not found");
      }
      return updatedUser;
    } catch (error) {
      throw new HttpException(
        500,
        "update_user_failed",
        `Failed to update user: ${error}`
      );
    }
  }

  /**
   * Completely delete a user from the system
   */
  public async deleteUser(userId: string): Promise<string> {
    try {
      const deletedUser = await this.user.findByIdAndDelete(userId);
      if (!deletedUser) {
        throw new HttpException(404, "user_not_found", "User not found");
      }
      return "User successfully deleted from the system.";
    } catch (error) {
      throw new HttpException(
        500,
        "delete_user_failed",
        `Failed to delete user: ${error}`
      );
    }
  }

  /**
   * Ban a user (set status to 'Banned')
   */
  public async banUser(userId: string): Promise<string> {
    try {
      const user = await this.user.findById(userId);
      if (!user) {
        throw new HttpException(404, "user_not_found", "User not found");
      }

      user.userStatus = UserStatus.Banned;
      await user.save();
      return "User has been banned.";
    } catch (error) {
      throw new HttpException(
        500,
        "ban_user_failed",
        `Failed to ban user: ${error}`
      );
    }
  }

  /**
   * Unban a user (set status to 'Active')
   */
  public async unbanUser(userId: string): Promise<string> {
    try {
      const user = await this.user.findById(userId);
      if (!user) {
        throw new HttpException(404, "user_not_found", "User not found");
      }

      user.userStatus = UserStatus.Active;
      await user.save();
      return "User has been unbanned.";
    } catch (error) {
      throw new HttpException(
        500,
        "unban_user_failed",
        `Failed to unban user: ${error}`
      );
    }
  }

  public async toggleMaintenanceMode(enabled: boolean): Promise<string> {
    try {
      const envFilePath = path.join(process.cwd(), ".env");

      const envContent = await readFileAsync(envFilePath, "utf8");
      const updatedEnvContent = envContent
        .split("\n")
        .map((line) =>
          line.startsWith("MAINTENANCE_MODE=")
            ? `MAINTENANCE_MODE=${enabled}`
            : line
        )
        .join("\n");

      await writeFileAsync(envFilePath, updatedEnvContent, "utf8");
      console.log(`Updated .env file: MAINTENANCE_MODE=${enabled}`);

      this.restartApplication();

      return `Maintenance mode has been ${enabled ? "enabled" : "disabled"}.`;
    } catch (error) {
      throw new HttpException(
        500,
        "maintenance_mode",
        `Failed to toggle maintenance mode: ${error.message}`
      );
    }
  }

  private restartApplication(): void {
    console.log("Restarting the application...");

    exec("pm2 restart all", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error restarting application: ${error.message}`);
        return;
      }
      if (stderr) {
        console.warn(`Standard error during restart: ${stderr}`);
        return;
      }
      console.log(`Application restarted successfully: ${stdout}`);
    });
  }

  public async enable2FAGlobally(): Promise<any> {
    const users = await this.user
      .find({ is2FAEnabled: false })
      .select("email username");
    const batchSize = 1000;
    const emailTemplate = MailTemplates.global2FAEnabled;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const emailPromises = batch.map((user) =>
        this.mailer.sendMail(
          user.email,
          "Two-Factor Authentication Enabled (2FA)",
          emailTemplate,
          "security",
          {
            name: `${user.username}`,
            companyName: "Wond3r Card",
            supportLink: "wond3rcard.com/support",
          }
        )
      );

      await Promise.all(emailPromises);
    }

    return this.user.updateMany(
      { is2FAEnabled: false },
      { $set: { is2FAEnabled: true } }
    );
  }
}

export default AdminService;
