import nodemailer from "nodemailer";


class NodeMailerService {

  private parseTemplate(template: string, data: Record<string, string>): string {
    return template.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] || '');
  }

  public async sendMail(recieverEmails: string | string[],
    subject: string, template: string, mailCategory: string, data: Record<string, string>) {
    try {

      const user = process.env.EMAIL_USER
      const pass = process.env.EMAIL_PASS

      const gmailTransporter = nodemailer.createTransport({
        // secure: true,
        host: "smtp.gmail.com",
        port: 465,
        type: "login",
        auth: {
          user: user,
          pass: pass
        }
      })

      const sender = {
        address: user,
        name: "Wond3r Card",
      };

      const recipients = Array.isArray(recieverEmails)
        ? recieverEmails
        : [recieverEmails];
      const htmlContent = this.parseTemplate(template, data);

      const info = await gmailTransporter.sendMail({
        from: sender,
        to: recipients,
        subject: subject,
        html: htmlContent,
        category: mailCategory || "General",
        sandbox: true
      });

      console.log(`Email sent: ${info.messageId}`);

      return info
    } catch (error) {
      console.error(`Error sending email: ${error}`);
    }
  }

}

export default NodeMailerService;
