import mongoose, { Schema, Document, model } from "mongoose";

export interface IConnection extends Document {
  user: mongoose.Types.ObjectId;
  connections: mongoose.Types.ObjectId[];
}

const ConnectionSchema = new Schema<IConnection>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  connections: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

export default model<IConnection>("Connection", ConnectionSchema);
