import { Schema, model } from "mongoose";

const CardTemplateSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    design: { type: String, required: true }, // SVG string or file reference
    priceNaira: { type: Number, required: true },
    priceUsd: { type: Number, required: true },
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
    isCustom: { type: Boolean, required: true }, // New field to differentiate
    finalDesign: {
      type: String,
      required: true,
      validate: {
        validator: function (value: string) {
          if (this.isCustom) {
            // Check if finalDesign is a file path (PNG/JPG/JPEG)
            return /\.(png|jpg|jpeg)$/i.test(value);
          } else {
            // Check if finalDesign is an SVG string
            return value.startsWith("<svg") && value.endsWith("</svg>");
          }
        },
        message: (props) =>
          props.instance.isCustom
            ? "Final design must be a PNG, JPG, or JPEG file path"
            : "Final design must be a valid SVG string",
      },
    },
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
