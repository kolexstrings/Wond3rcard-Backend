import { Document } from "mongoose";
import { PhysicalCardStatus } from "../physical-card.protocol";

export default interface IPhysicalCardOrder extends Document {
  userId: string;
  cardId: string;
  quantity: number;
  region: string;
  address: string;
  price: number;
  status: PhysicalCardStatus;
  createdAt: Date;
}
