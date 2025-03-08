import axios from "axios";
import tokenModel from "./token.model";
import { config } from "../../config/cloud-meeting";

class TokenService {
  // Save or update a token
  public async saveToken(
    userId: string,
    service: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ) {
    try {
      const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

      const token = await tokenModel.findOneAndUpdate(
        { userId, service },
        { accessToken, refreshToken, tokenExpiry },
        { upsert: true, new: true }
      );

      return token;
    } catch (error) {
      console.error("Error saving token:", error);
      throw error;
    }
  }

  // Retrieve a token
  public async getToken(userId: string, service: string) {
    try {
      return await tokenModel.findOne({ userId, service });
    } catch (error) {
      console.error("Error retrieving token:", error);
      throw error;
    }
  }

  // Update only access token and expiry
  public async updateToken(
    userId: string,
    service: string,
    accessToken: string,
    expiresIn: number
  ) {
    try {
      const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

      const token = await tokenModel.findOneAndUpdate(
        { userId, service },
        { accessToken, tokenExpiry },
        { new: true }
      );

      return token;
    } catch (error) {
      console.error("Error updating token:", error);
      throw error;
    }
  }

  // Delete a token
  public async deleteToken(userId: string, service: string) {
    try {
      return await tokenModel.findOneAndDelete({ userId, service });
    } catch (error) {
      console.error("Error deleting token:", error);
      throw error;
    }
  }

  // Retrieve or refresh Microsoft Teams token
  public async getMicrosoftTeamsToken(userId: string): Promise<string> {
    const tokenData = await this.getToken(userId, "microsoft_teams");
    if (tokenData && new Date() < new Date(tokenData.tokenExpiry)) {
      return tokenData.accessToken;
    }

    if (!tokenData?.refreshToken) {
      throw new Error("No refresh token available for Microsoft Teams.");
    }

    const response = await axios.post(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      null,
      {
        params: {
          grant_type: "refresh_token",
          refresh_token: tokenData.refreshToken,
          client_id: config.teams.clientId,
          client_secret: config.teams.clientSecret,
          scope:
            "https://graph.microsoft.com/OnlineMeetings.ReadWrite offline_access",
        },
      }
    );

    await this.saveToken(
      userId,
      "microsoft_teams",
      response.data.access_token,
      response.data.refresh_token,
      response.data.expires_in
    );

    return response.data.access_token;
  }
}

export default TokenService;
