import { Schema, model } from "mongoose";
import { PhysicalCardStatus } from "./physical-card.protocol";
import { Types } from "mongoose";

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
    cardId: { type: String, required: true },
    cardTemplate: {
      type: Schema.Types.ObjectId,
      ref: "CardTemplate",
      required: true,
    },
    primaryColor: { type: String, required: true },
    secondaryColor: { type: String, required: true },
    isCustom: { type: Boolean, default: false, required: true },
    finalDesign: {
      type: String,
      required: true,
      validate: {
        validator: function (value: string) {
          if (this.isCustom) {
            // If custom, must be an image file (PNG, JPG, JPEG)
            return /\.(png|jpg|jpeg)$/i.test(value);
          } else {
            // If not custom, must be a valid SVG string
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
      enum: Object.values(PhysicalCardStatus),
      default: PhysicalCardStatus.Pending,
    },
  },
  { timestamps: true }
);

const CardTemplateModel = model("CardTemplate", CardTemplateSchema);
const PhysicalCardModel = model("PhysicalCard", PhysicalCardSchema);

export { CardTemplateModel, PhysicalCardModel };
