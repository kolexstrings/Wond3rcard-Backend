import { Schema, model, Document } from "mongoose";
import { PhysicalCardStatus } from "../physical-card.protocol";

interface IPhysicalCardOrder extends Document {
  userId: string;
  cardId: string;
  quantity: number;
  region: string;
  price: number;
  status: "pending" | "paid" | "shipped";
  createdAt: Date;
}

const PhysicalCardOrderSchema = new Schema<IPhysicalCardOrder>(
  {
    userId: { type: String, required: true },
    cardId: { type: String, required: true },
    quantity: { type: Number, required: true },
    region: { type: String, required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(PhysicalCardStatus),
      default: PhysicalCardStatus.Pending,
    },
  },
  { timestamps: true }
);

export default model<IPhysicalCardOrder>(
  "PhysicalCardOrder",
  PhysicalCardOrderSchema
);
