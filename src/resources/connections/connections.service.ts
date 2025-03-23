import HttpException from "../../exceptions/http.exception";
import { AddConnection, RemoveConnection } from "./connections.protocol";
import userModel from "../user/user.model";
import { Types } from "mongoose";

class ConnectionService {
  public async addConnection(data: AddConnection): Promise<any> {
    try {
      const { userId, connectionId } = data;

      const userObjectId = new Types.ObjectId(userId);
      const connectionObjectId = new Types.ObjectId(connectionId);

      // Fetch both users
      const user = await userModel.findById(userId);
      const connection = await userModel.findById(connectionId);

      if (!user || !connection) {
        throw new HttpException(404, "error", "User not found");
      }

      if (user.connections.some((id) => id.equals(connectionObjectId))) {
        throw new HttpException(400, "error", "Connection already exists");
      }

      user.connections.push(connectionObjectId);
      connection.connections.push(userObjectId);
      await user.save();
      await connection.save();

      return user;
    } catch (error) {
      const status = typeof error.status === "number" ? error.status : 500;
      throw new HttpException(
        status,
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

      return userConnections.connections;
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
