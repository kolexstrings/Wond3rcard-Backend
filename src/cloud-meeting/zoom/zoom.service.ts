import axios from "axios";
import { config } from "../../config/cloud-meeting";

class ZoomService {
  static getAuthUrl(): string {
    return `https://zoom.us/oauth/authorize?response_type=code&client_id=${config.zoom.clientId}&redirect_uri=${config.zoom.redirectUri}`;
  }

  public async getAccessToken(code: string): Promise<string> {
    const response = await axios.post("https://zoom.us/oauth/token", null, {
      params: {
        grant_type: "authorization_code",
        code,
        redirect_uri: config.zoom.redirectUri,
      },
      auth: {
        username: config.zoom.clientId,
        password: config.zoom.clientSecret,
      },
    });
    return response.data.access_token;
  }

  public async createMeeting(
    accessToken: string,
    topic: string,
    duration: number
  ) {
    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic,
        type: 2,
        duration,
        start_time: new Date().toISOString(),
        settings: { host_video: true, participant_video: true },
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return response.data.join_url;
  }
}

export default ZoomService;
