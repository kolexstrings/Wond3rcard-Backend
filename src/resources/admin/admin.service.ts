import { exec } from "child_process";
import dotenv from 'dotenv';
import fs from 'fs';
import HttpException from "../../exceptions/http.exception";
import MailTemplates from "../mails/mail.templates";
import NodeMailerService from "../mails/nodemailer.service";
import userModel from "../user/user.model";
import { User } from "../user/user.protocol";


class AdminService {
  private user = userModel;
  private mailer = new NodeMailerService()

  public async getAllUsers(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        userModel.find().skip(skip).limit(limit),
        userModel.countDocuments()
      ]);

      return { users, total };
    } catch (error) {
      throw new HttpException(500, "failed", "Unable to retrieve users");
    }
  }



  public toggleMaintenanceMode(enabled: boolean): string {
    try {
      const envFilePath = '/Users/usr/Developer/web/won3rcard_backend/.env';
      dotenv.config({ path: envFilePath });

      const envVars = fs.readFileSync(envFilePath, 'utf8').split('\n');
      const updatedEnvVars = envVars.map((line) => {
        if (line.startsWith('MAINTENANCE_MODE=')) {
          return `MAINTENANCE_MODE=${enabled}`;
        }
        return line;
      });

      fs.writeFileSync(envFilePath, updatedEnvVars.join('\n'), 'utf8');
      console.log(`Updated .env file: MAINTENANCE_MODE=${enabled}`);

      this.restartApplication();

      return `Maintenance mode has been ${enabled ? 'enabled' : 'disabled'}.`;
    } catch (error) {
      throw new HttpException(
        500,
        'maintenance_mode',
        `Unable to toggle maintenance mode: ${error}`
      );
    }
  }


  private restartApplication(): void {
    console.log('Restarting the application...');

    exec('pm2 restart all', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error restarting application: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Standard error during restart: ${stderr}`);
        return;
      }
      console.log(`Application restarted successfully: ${stdout}`);
    });
  }

  public async enable2FAGlobally(): Promise<any> {
    const users = await this.user.find({ is2FAEnabled: false }).select('email username');
    const batchSize = 1000;

    const emailTemplate = MailTemplates.global2FAEnabled;



    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const emails = batch.map(user => ({
        email: user.email,
        data: {
          name: `${user.username}`,
          companyName: `Wond3r Card`,
          supportLink: "wond3rcard.com/support",
        },
      }));

      for (const { email, data } of emails) {
        await this.mailer.sendMail(
          email,
          "Two-Factor Authentication Enabled (2FA)",
          emailTemplate,
          "security",
          data
        );
      }

    }

    const result = await this.user.updateMany(
      { is2FAEnabled: false },
      { $set: { is2FAEnabled: true } }
    );
    return result;
  }
}

export default AdminService;
