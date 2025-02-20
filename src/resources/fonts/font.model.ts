import mongoose, { model } from "mongoose";
import { Font } from "./font.protocol";

const fontSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    style: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);
export default model<Font>('Font', fontSchema)

