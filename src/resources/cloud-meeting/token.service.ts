import tokenModel from "./token.model";

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
      const tokenExpiry = new Date(Date.now() + expiresIn * 1000); // Convert seconds to milliseconds

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

  // Delete a token
  public async deleteToken(userId: string, service: string) {
    try {
      return await tokenModel.findOneAndDelete({ userId, service });
    } catch (error) {
      console.error("Error deleting token:", error);
      throw error;
    }
  }
}

export default TokenService;
