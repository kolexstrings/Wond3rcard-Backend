import dotenv from "dotenv";

dotenv.config();

export const config = {
  zoom: {
    clientId: process.env.ZOOM_CLIENT_ID!,
    clientSecret: process.env.ZOOM_CLIENT_SECRET!,
    redirectUri: process.env.ZOOM_REDIRECT_URI!,
  },
  teams: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
  },
  meet: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  },
};
