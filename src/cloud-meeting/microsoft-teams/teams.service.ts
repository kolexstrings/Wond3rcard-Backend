import axios from "axios";
import { config } from "../config/env";

class TeamsService {
  static getAuthUrl(): string {
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${config.teams.clientId}&response_type=code&redirect_uri=${config.teams.redirectUri}&response_mode=query&scope=offline_access%20https://graph.microsoft.com/OnlineMeetings.ReadWrite`;
  }

  public async getAccessToken(code: string): Promise<string> {
    const response = await axios.post(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: config.teams.redirectUri,
          client_id: config.teams.clientId,
          client_secret: config.teams.clientSecret,
          scope:
            "https://graph.microsoft.com/OnlineMeetings.ReadWrite offline_access",
        },
      }
    );

    return response.data.access_token;
  }

  public async createMeeting(
    accessToken: string,
    topic: string,
    startTime: string,
    duration: number
  ) {
    const response = await axios.post(
      "https://graph.microsoft.com/v1.0/me/onlineMeetings",
      {
        subject: topic,
        startDateTime: startTime,
        endDateTime: new Date(
          new Date(startTime).getTime() + duration * 60000
        ).toISOString(),
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return response.data.joinUrl;
  }
}

export default TeamsService;
