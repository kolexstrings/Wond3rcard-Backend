import { Schema, model } from "mongoose";
import { PhysicalCardStatus } from "../physical-card.protocol";
import { IPhysicalCardOrder } from "./order.protocol";

const PhysicalCardOrderSchema = new Schema<IPhysicalCardOrder>(
  {
    userId: { type: String, required: true },
    cardId: { type: String, required: true },
    quantity: { type: Number, required: true },
    region: { type: String, required: true },
    address: { type: String, required: true },
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
