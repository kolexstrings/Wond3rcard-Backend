import { exec } from "child_process";
import dotenv from "dotenv";
import fs from "fs";
import { promisify } from "util";
import path from "path";
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
import HttpException from "../../exceptions/http.exception";
import MailTemplates from "../mails/mail.templates";
import NodeMailerService from "../mails/nodemailer.service";
import userModel from "../user/user.model";
import { User } from "../user/user.protocol";

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

  public async toggleMaintenanceMode(enabled: boolean): Promise<string> {
    try {
      const envFilePath = path.join(process.cwd(), ".env"); // Dynamically resolve .env path

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
