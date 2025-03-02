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
import cardModel from "../card/card.model";
import roleModel from "./role/role.model";
import statusModel from "./status/status.model";
import tierModel from "./subscriptionTier/tier.model";
import { User, UserRole, UserStatus, UserTiers } from "../user/user.protocol";
import { CreateSubscriptionTier } from "./admin.protocol";
import { Card } from "../card/card.protocol";
import { ITier } from "./subscriptionTier/tier.model";

class AdminService {
  private user = userModel;
  private mailer = new NodeMailerService();
  private role = roleModel;
  private status = statusModel;
  private tier = tierModel;

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

  /**
   * get all roles available
   */
  public async getRoles(): Promise<string[]> {
    try {
      const roles = await this.role.find();
      return roles.map((role) => role.name);
    } catch (error) {
      throw new HttpException(
        500,
        "get_roles_failed",
        `Failed to retrieve roles: ${error}`
      );
    }
  }

  /**
   * get all statuses available
   */
  public async getStatuses(): Promise<string[]> {
    try {
      const statuses = await this.status.find();
      return statuses.map((status) => status.name);
    } catch (error) {
      throw new HttpException(
        500,
        "get_statuses_failed",
        `Failed to retrieve statuses: ${error}`
      );
    }
  }

  /**
   * change role of a specific user
   */
  public async changeUserRole(
    userId: string,
    newRole: UserRole
  ): Promise<string> {
    try {
      const user = await this.user.findById(userId);
      if (!user) {
        throw new HttpException(404, "user_not_found", "User not found");
      }

      const roleExists = await this.role.findOne({ name: newRole });
      if (!roleExists) {
        throw new HttpException(400, "invalid_role", "Role does not exist");
      }

      user.userRole = newRole;
      await user.save();
      return "User role updated successfully.";
    } catch (error) {
      throw new HttpException(
        500,
        "update_user_role_failed",
        `Failed to update user role: ${error}`
      );
    }
  }

  /**
   * change role of a specific user
   */
  public async changeUserStatus(
    userId: string,
    newStatus: UserStatus
  ): Promise<string> {
    try {
      const user = await this.user.findById(userId);
      if (!user) {
        throw new HttpException(404, "user_not_found", "User not found");
      }

      const statusExists = await this.status.findOne({ name: newStatus });
      if (!statusExists) {
        throw new HttpException(400, "invalid_status", "Status does not exist");
      }

      user.userStatus = newStatus;
      await user.save();
      return "User status updated successfully.";
    } catch (error) {
      throw new HttpException(
        500,
        "update_user_status_failed",
        `Failed to update user status: ${error}`
      );
    }
  }

  /**
   * change subscription tier of a specific user
   */
  public async changeUserTier(
    userId: string,
    newTier: UserTiers
  ): Promise<string> {
    try {
      const user = await this.user.findById(userId);
      if (!user) {
        throw new HttpException(404, "user_not_found", "User not found");
      }

      const tierExists = await this.tier.findOne({ name: newTier });
      if (!tierExists) {
        throw new HttpException(
          400,
          "invalid_tier",
          "Subscription tier does not exist"
        );
      }

      user.userTiers = newTier;
      await user.save();
      return "User subscription tier updated successfully.";
    } catch (error) {
      throw new HttpException(
        500,
        "update_user_tier_failed",
        `Failed to update user subscription tier: ${error}`
      );
    }
  }

  async getAllCards(): Promise<Card[]> {
    return await cardModel.find();
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

  public async createSubscriptionTier(
    tierData: CreateSubscriptionTier
  ): Promise<ITier> {
    try {
      const {
        name,
        billingCycle,
        description,
        trialPeriod,
        autoRenew,
        features,
      } = tierData;

      // Normalize input to lowercase to match enum values
      const normalizedTierName = name.toLowerCase();

      // Validate if the tier name is in the allowed UserTiers enum
      if (!Object.values(UserTiers).includes(normalizedTierName as UserTiers)) {
        throw new HttpException(
          400,
          "bad_request",
          `Invalid subscription tier. Allowed tiers: ${Object.values(
            UserTiers
          ).join(", ")}`
        );
      }

      // Ensuring billingCycle exists before checking its properties
      if (!billingCycle || !billingCycle.monthly || !billingCycle.yearly) {
        throw new HttpException(
          400,
          "bad_request",
          "Billing cycle with both monthly and yearly options is required."
        );
      }

      // Extract prices and ensure valid values
      const { monthly, yearly } = billingCycle;
      if (!monthly.price || !yearly.price) {
        throw new HttpException(
          400,
          "bad_request",
          "Both monthly and yearly pricing must be provided."
        );
      }

      // Checking if a tier with the same normalized name already exists
      const existingTier = await this.tier.findOne({
        name: normalizedTierName,
      });
      if (existingTier) {
        throw new HttpException(
          409,
          "conflict",
          "Subscription tier already exists."
        );
      }

      // Create and save the new subscription tier
      const newTier = new this.tier({
        name: normalizedTierName as UserTiers,
        billingCycle: {
          monthly: {
            price: monthly.price,
            durationInDays: monthly.durationInDays || 30, // Default to 30 days if not provided
          },
          yearly: {
            price: yearly.price,
            durationInDays: yearly.durationInDays || 365, // Default to 365 days if not provided
          },
        },
        description,
        trialPeriod,
        autoRenew,
        features,
      });

      return await newTier.save();
    } catch (error) {
      throw error;
    }
  }

  /**
   * get all subscription tiers available
   */
  public async getSubscriptionTiers(): Promise<string[]> {
    try {
      const tiers = await this.tier.find();
      return tiers.map((tier) => tier.name);
    } catch (error) {
      throw new HttpException(
        500,
        "get_subscription_tiers_failed",
        `Failed to retrieve subscription tiers: ${error}`
      );
    }
  }

  public async updateSubscriptionTier(
    id: string,
    updateData: Partial<CreateSubscriptionTier>
  ): Promise<ITier | null> {
    try {
      const updatedTier = await this.tier.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      return updatedTier;
    } catch (error) {
      throw new HttpException(
        500,
        "internal_server_error",
        "Failed to update subscription tier."
      );
    }
  }

  public async getSubscriptionTierById(id: string): Promise<ITier | null> {
    try {
      const tier = await this.tier.findById(id);
      return tier;
    } catch (error) {
      throw new HttpException(
        500,
        "internal_server_error",
        "Failed to fetch subscription tier"
      );
    }
  }

  public async getSubscriptionTierCount(): Promise<number> {
    try {
      return await this.tier.countDocuments({});
    } catch (error) {
      throw new HttpException(
        500,
        "internal_server_error",
        "Failed to count subscription tiers"
      );
    }
  }

  public async transferUsersToNewTier(
    oldTierId: string,
    newTierId: string
  ): Promise<void> {
    try {
      const usersToUpdate = await this.user.find({
        subscriptionTier: oldTierId,
      });

      if (usersToUpdate.length > 0) {
        await this.user.updateMany(
          { subscriptionTier: oldTierId },
          { $set: { subscriptionTier: newTierId } }
        );
      }
    } catch (error) {
      throw new HttpException(
        500,
        "internal_server_error",
        "Failed to transfer users"
      );
    }
  }

  public async deleteSubscriptionTier(id: string): Promise<void> {
    try {
      const deletedTier = await this.tier.findByIdAndDelete(id);
      if (!deletedTier) {
        throw new HttpException(
          404,
          "not_found",
          "Subscription tier not found"
        );
      }
    } catch (error) {
      throw new HttpException(
        500,
        "internal_server_error",
        "Failed to delete subscription tier"
      );
    }
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
