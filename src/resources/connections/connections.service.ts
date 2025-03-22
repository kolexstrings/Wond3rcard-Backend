import HttpException from "../../exceptions/http.exception";
import ConnectionModel from "./connections.model";
import { AddConnection, RemoveConnection } from "./connections.protocol";
import userModel from "../user/user.model";

class ConnectionService {
  private connection = ConnectionModel;

  public async addConnection(data: AddConnection): Promise<any> {
    try {
      const { userId, connectionId } = data;

      // Fetch both users
      const user = await userModel.findById(userId);
      const connection = await userModel.findById(connectionId);

      if (!user || !connection) {
        throw new HttpException(404, "error", "User not found");
      }

      if (user.connections.includes(connectionId)) {
        throw new HttpException(400, "error", "Connection already exists");
      }

      user.connections.push(connectionId);
      connection.connections.push(userId); // Mutual connection
      await user.save();
      await connection.save();

      return user;
    } catch (error) {
      throw new HttpException(
        error.status || 500,
        "error",
        error.message || "Could not add connection"
      );
    }
  }

  public async removeConnection(data: RemoveConnection): Promise<any> {
    try {
      const { userId, connectionId } = data;

      const user = await userModel.findById(userId);
      const connection = await userModel.findById(connectionId);

      if (!user || !connection) {
        throw new HttpException(404, "error", "User not found");
      }

      user.connections = user.connections.filter(
        (id) => id.toString() !== connectionId
      );
      connection.connections = connection.connections.filter(
        (id) => id.toString() !== userId
      );

      await user.save();
      await connection.save();

      return user;
    } catch (error) {
      throw new HttpException(
        error.status || 500,
        "error",
        error.message || "Could not remove connection"
      );
    }
  }

  public async getUserConnections(userId: string): Promise<any> {
    try {
      const userConnections = await userModel
        .findById(userId)
        .populate("connections", "_id username email");

      if (!userConnections) {
        throw new HttpException(404, "error", "User has no connections");
      }

      return userConnections;
    } catch (error) {
      throw new HttpException(
        error.status || 500,
        "error",
        error.message || "Could not retrieve connections"
      );
    }
  }
}

export default ConnectionService;
