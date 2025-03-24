import { Document, Types } from "mongoose";

interface CardTemplate extends Document {
  name: string;
  design: string; // SVG string or file reference
  price: number;
  createdBy: Types.ObjectId; // Reference to the admin who created it
}

interface PhysicalCard extends Document {
  user: Types.ObjectId; // Reference to the user ordering the card
  cardTemplate: Types.ObjectId; // Reference to the selected card template
  quantity: number;
  primaryColor: string;
  secondaryColor: string;
  finalDesign: string; // Final SVG string after user customization
  status: "pending" | "processing" | "shipped" | "delivered";
}

export { CardTemplate, PhysicalCard };
