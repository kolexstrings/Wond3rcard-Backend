import mongoose, { Schema, Document } from "mongoose";

export interface IRole extends Document {
  name: string;
}

const RoleSchema = new Schema<IRole>({
  name: { type: String, required: true, unique: true },
});

export default mongoose.model<IRole>("Role", RoleSchema);
