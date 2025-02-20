import { bool, cleanEnv, port, str } from "envalid";

function validateEnv(): void {
  cleanEnv(process.env, {
    NODE_ENV: str({
      choices: ["development", "production"]
    }),
    MONGO_PASSWORD: str(),
    MONGO_PATH: str(),
    MONGO_USER: str(),
    PORT: port({ default: 3000 }),
    JWT_SECRET: str(),
    REFRESH_TOKEN_SECRET: str(),
    REDIS_CLIENT_URL: str(),
    REDIS_CLIENT_PORT: str(),
    SESSION_SECRET: str(),
    GOOGLE_CLIENT_ID: str(),
    ZOOM_ACCOUNT_ID: str(),
    ZOOM_CLIENT_ID: str(),
    ZOOM_CLIENT_SECRET: str(),
    ZOOM_SECRET_TOKEN: str(),
    ZOOM_VERIFICATION_TOKEN: str(),
    GOOGLE_CLIENT_SECRET: str(),
    GOOGLE_REDIRECT_URI: str(),
    EMAIL_USER: str(),
    EMAIL_PASS: str(),
    MAILGUN_API_KEY: str(),
    MAILGUN_SMTP_HOST: str(),
    MAILGUN_SMTP_PORT: port({ default: 587 }),
    MAILGUN_USERNAME: str(),
    MAILGUN_PASSWORD: str(),
    SLACK_BOT_TOKEN: str(),
    SLACK_SIGNING_SECRET: str(),
    STANDUP_CHANNEL_ID: str(),
    SLACK_PORT: str(),
    DO_SPACE_ACCESS_KEY: str(),
    DO_SPACE_SECRET_KEY: str(),
    DO_SPACE_REGION: str(),
    DO_SPACE_NAME: str(),
    PAYSTACK_PUBLIC_KEY: str(),
    PAYSTACK_SECRET_KEY: str(),
    PAYSTACK_FRONTEND_PUBLIC_KEY: str(),
    STRIPE_PUBLIC_KEY: str(),
    STRIPE_SECRET_KEY: str(),
    STRIPE_FRONTEND_PUBLIC_KEY: str(),
    STRIPE_WEBHOOK_SECRET: str(),
    FIREBASE_SERVICE_ACCOUNT_KEY: str(),
    MAINTENANCE_MODE: bool(),
  })

}

export default validateEnv