import { Schema, model } from "mongoose";

const CardTemplateSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    design: { type: String, required: true }, // SVG string or file reference
    price: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const PhysicalCardSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cardTemplate: {
      type: Schema.Types.ObjectId,
      ref: "CardTemplate",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    primaryColor: { type: String, required: true },
    secondaryColor: { type: String, required: true },
    finalDesign: { type: String, required: true }, // SVG string after customization
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const CardTemplateModel = model("CardTemplate", CardTemplateSchema);
const PhysicalCardModel = model("PhysicalCard", PhysicalCardSchema);

export { CardTemplateModel, PhysicalCardModel };
