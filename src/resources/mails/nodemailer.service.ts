import nodemailer from "nodemailer";

class NodeMailerService {
  private parseTemplate(
    template: string,
    data: Record<string, string>
  ): string {
    return template.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] || "");
  }

  public async sendMail(
    receiverEmails: string | string[],
    subject: string,
    template: string,
    data: Record<string, string>
  ) {
    try {
      const user = process.env.EMAIL_USER;
      const pass = process.env.EMAIL_PASS;

      if (!user || !pass) {
        throw new Error(
          "Missing EMAIL_USER or EMAIL_PASS in environment variables."
        );
      }

      const gmailTransporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465, // Port 465 for secure SSL/TLS connection
        secure: true, // Required for port 465
        auth: { user, pass },
      });

      const recipients = Array.isArray(receiverEmails)
        ? receiverEmails
        : [receiverEmails];
      const htmlContent = this.parseTemplate(template, data);

      const info = await gmailTransporter.sendMail({
        from: `"Wond3r Card" <${user}>`, // Correct format
        to: recipients.join(","), // Convert array to comma-separated string
        subject,
        html: htmlContent,
      });

      console.log(`✅ Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`❌ Error sending email: ${error}`);
      throw error;
    }
  }
}

export default NodeMailerService;
