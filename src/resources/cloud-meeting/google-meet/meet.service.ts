import axios from "axios";
import { google } from "googleapis";
import { config } from "../../../config/cloud-meeting";
import TokenService from "../token.service";

class GoogleMeetService {
  private tokenService = new TokenService();
  private oauth2Client = new google.auth.OAuth2(
    config.meet.clientId,
    config.meet.clientSecret,
    config.meet.redirectUri
  );

  public async getAuthUrl(): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      config.meet.clientId,
      config.meet.clientSecret,
      config.meet.redirectUri
    );

    const scopes = ["https://www.googleapis.com/auth/calendar.events"];
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });
  }

  public async getAccessToken(userId: string, code: string): Promise<string> {
    const { tokens } = await this.oauth2Client.getToken(code);

    // Store the access and refresh token
    await this.tokenService.saveToken(
      userId,
      "google_meet",
      tokens.access_token!,
      tokens.refresh_token!,
      tokens.expiry_date! / 1000
    );

    return tokens.access_token!;
  }

  public async getValidAccessToken(userId: string): Promise<string> {
    const tokenData = await this.tokenService.getToken(userId, "google_meet");

    if (!tokenData) {
      throw new Error("No Google Meet token found. Please authorize again.");
    }

    const { accessToken, refreshToken, tokenExpiry } = tokenData;

    // Check if token is expired
    if (new Date() >= tokenExpiry) {
      return await this.refreshAccessToken(userId, refreshToken);
    }

    return accessToken;
  }

  public async refreshAccessToken(
    userId: string,
    refreshToken: string
  ): Promise<string> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error("Failed to refresh Google Meet access token.");
    }

    // Update the stored token
    await this.tokenService.updateToken(
      userId,
      "google_meet",
      credentials.access_token,
      credentials.expiry_date! / 1000
    );

    return credentials.access_token;
  }

  public async createMeeting(
    userId: string,
    topic: string,
    startTime: string,
    duration: number
  ) {
    const accessToken = await this.getValidAccessToken(userId);
    const endTime = new Date(
      new Date(startTime).getTime() + duration * 60000
    ).toISOString();

    const response = await axios.post(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        summary: topic,
        start: { dateTime: startTime },
        end: { dateTime: endTime },
        conferenceData: { createRequest: { requestId: "meet-" + Date.now() } },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.hangoutLink;
  }
}

export default GoogleMeetService;
