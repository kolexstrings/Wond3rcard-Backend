import "dotenv/config";
import App from "./app";
import AdminController from "./resources/admin/admin.controller";
import AppInfoController from "./resources/app-info/app-info.controller";
import AuthController from "./resources/auth/auth.controller";
import CardController from "./resources/card/card.controller";
import FAQController from "./resources/faq/faq.controller";
import FeatureFlagsController from "./resources/feature-flag/feature-flag.controller";
import FontsController from "./resources/fonts/font.controller";
import InteractionController from "./resources/interactions/interaction.controller";
import OrganizationController from "./resources/organization/organization.controller";
import ProfileController from "./resources/profile/profile.controller";
import SocialMediaController from "./resources/social-media/social-media.controller";
import UserController from "./resources/user/user.controller";
import validateEnv from "./utils/validate-env";

validateEnv();

const app = new App(
  [
    new AppInfoController(),
    new AdminController(),
    new AuthController(),
    new CardController(),
    new FAQController(),
    new FeatureFlagsController(),
    new FontsController(),
    new InteractionController(),
    new OrganizationController(),
    new ProfileController(),
    new SocialMediaController(),
    new UserController(),
  ],
  Number(process.env.PORT)
);

app.listen();
