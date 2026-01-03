import { Resend } from "resend";

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
    mailCategory: string,
    data: Record<string, string>
  ) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      const sender = {
        address: process.env.EMAIL_USER || "noreply@wond3rcard.com",
        name: "Wond3r Card",
      };

      const recipients = Array.isArray(receiverEmails)
        ? receiverEmails
        : [receiverEmails];
      const htmlContent = this.parseTemplate(template, data);

      console.log("Using FROM address:", sender.address);

      const { data: response, error } = await resend.emails.send({
        from: `${sender.name} <${sender.address}>`,
        to: recipients,
        subject: subject,
        html: htmlContent,
        headers: {
          "X-Category": mailCategory || "General",
        },
      });

      if (error) {
        console.error(`Error sending email: ${error.message}`);
        throw error;
      }

      console.log(`Email sent: ${response?.id}`);

      return response;
    } catch (error) {
      console.error(`Error sending email: ${error.message}`);
      throw error;
    }
  }
}

export default NodeMailerService;
