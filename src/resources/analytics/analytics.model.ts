import { Document, model, Schema } from "mongoose";
import { Analytic } from "./analytic.protocol";
const AnalyticSchema = new Schema<Analytic & Document>(
  {
    method: { type: String, required: true },
    url: { type: String, required: true },
    headers: { type: Object, required: true },
    body: { type: Object, required: true },
    response: {
      statusCode: { type: Number, required: false },
      statusMessage: { type: String, required: false },
      responseTime: { type: Number, required: false },
      headers: { type: Object, required: false },
    },
    ipAddress: { type: String, required: true },
    geolocation: {
      city: { type: String, required: false },
      region: { type: String, required: false },
      country: { type: String, required: false },
      countryName: { type: String, required: false },
      loc: { type: String, required: false },
      postal: { type: String, required: false },
      timezone: { type: String, required: false },
      currency: { type: String, required: false },
      callingCode: { type: String, required: false },
      latitude: { type: Number, required: false },
      longitude: { type: Number, required: false },
      asn: { type: String, required: false },
      org: { type: String, required: false },
      continent_code: { type: String, required: false },
      in_eu: { type: Boolean, required: false },
      country_code_iso3: { type: String, required: false },
      country_capital: { type: String, required: false },
      country_area: { type: Number, required: false },
      country_population: { type: Number, required: false },
      utc_offset: { type: String, required: false },
      languages: { type: String, required: false },
    },
    deviceInfo: {
      browser: { type: String, required: true },
      os: { type: String, required: true },
      device: { type: String, required: true },
    },
    analyticUser: {
      isWonderCardUser: { type: Boolean, required: true, default: false },
      uid: { type: String, required: false },
      fullName: { type: String, required: true, default: 'Anonymous' },
    },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const AnalyticModel = model<Analytic & Document>("Analytic", AnalyticSchema);
export default AnalyticModel;
