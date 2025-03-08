import axios from "axios";
import { google } from "googleapis";
import { config } from "../../../config/cloud-meeting";

class GoogleMeetService {
  static getAuthUrl(): string {
    const oauth2Client = new google.auth.OAuth2(
      config.meet.clientId,
      config.meet.clientSecret,
      config.meet.redirectUri
    );

    const scopes = ["https://www.googleapis.com/auth/calendar.events"];
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });
  }

  public async getAccessToken(code: string): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      config.meet.clientId,
      config.meet.clientSecret,
      config.meet.redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    return tokens.access_token!;
  }

  public async createMeeting(
    accessToken: string,
    topic: string,
    startTime: string,
    duration: number
  ) {
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
