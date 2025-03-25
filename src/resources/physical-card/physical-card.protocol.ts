import { Document, Types } from "mongoose";

enum PhysicalCardStatus {
  Pending = "pending",
  Processing = "processing",
  Shipped = "shipped",
  Delivered = "delivered",
}

interface CardTemplate extends Document {
  name: string;
  design: string; // SVG string or file reference
  priceNaira: number;
  priceUsd: number;
  createdBy: Types.ObjectId; // Reference to the admin who created it
}

interface PhysicalCard extends Document {
  user: Types.ObjectId; // Reference to the user ordering the card
  cardId: string;
  cardTemplate: Types.ObjectId; // Reference to the selected card template
  primaryColor: string;
  secondaryColor: string;
  finalDesign: string; // Final SVG string after user customization
  isCustom: boolean;
  status: PhysicalCardStatus;
  createdAt: Date;
  updatedAt: Date;
}

export { CardTemplate, PhysicalCard, PhysicalCardStatus };
