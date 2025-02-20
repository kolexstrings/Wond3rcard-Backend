import { model, Schema } from "mongoose";
import { Interaction, InteractionType } from "./interaction.protocol";

const interactionSchema = new Schema<Interaction>({
  cardId: { type: Schema.Types.ObjectId, required: true, ref: 'Card' }, // Referencing a user (creator)
  cardOwnerId: { type: Schema.Types.ObjectId, required: true, ref: 'User' }, // Referencing a user (creator)
  interactionType: { type: String, enum: Object.values(InteractionType), required: true },
  ipAddress: { type: String, default: "" },
  geolocation: {
    type: {
      ip: { type: String, default: "" },
      network: { type: String, default: "" },
      version: { type: String, default: "IPv4" },
      city: { type: String, default: "" },
      region: { type: String, default: "" },
      region_code: { type: String, default: "" },
      country: { type: String, default: "" },
      country_name: { type: String, default: "" },
      country_code: { type: String, default: "" },
      country_code_iso3: { type: String, default: "" },
      country_capital: { type: String, default: "" },
      country_tld: { type: String, default: "" },
      continent_code: { type: String, default: "" },
      in_eu: { type: Boolean, default: false },
      postal: { type: String, default: "" },
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
      timezone: { type: String, default: "" },
      utc_offset: { type: String, default: "" },
      country_calling_code: { type: String, default: "" },
      currency: { type: String, default: "" },
      currency_name: { type: String, default: "" },
      languages: { type: String, default: "" },
      country_area: { type: Number, default: 0 },
      country_population: { type: Number, default: 0 },
      asn: { type: String, default: "" },
      org: { type: String, default: "" },
    },
    default: null,
  },
  deviceInfo: {
    type: {
      agent: { type: String, default: "" },
      os: { type: String, default: "" },
      device: { type: String, default: "" },
    },
    default: null,
  },
  interactor: {
    type: {
      isWonderCardUser: { type: Boolean, default: false },
      uid: { type: String, required: true },
      fullName: { type: String, default: "" },
    },
    required: true,
  },
}, {
  timestamps: true,
});

export default model<Interaction>("Interaction", interactionSchema);
