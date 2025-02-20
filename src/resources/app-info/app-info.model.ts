import { Schema } from 'mongoose';


import { model } from "mongoose";
import AppInfo from './app-info.protocol';

const appInfoSchema = new Schema({
  helpAndSupport: { type: String, required: true },
  adminEmail: { type: String, required: true },
  contactEmail: { type: String, required: true },
  address: { type: String, required: true },
  appLogo: { type: String, required: false },
  privacyPolicyURL: { type: String, required: true },
  termsOfServiceURL: { type: String, required: true },
  appVersion: { type: String, required: true },
  websiteURL: { type: String, required: true },
  appStoreURL: { type: String, required: false },
  playStoreURL: { type: String, required: false },
  socialMediaLinks: {
    facebook: { type: String, required: false },
    twitter: { type: String, required: false },
    instagram: { type: String, required: false },
    linkedin: { type: String, required: false },
  },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, required: false },

},
  {
    timestamps: true
  },
)


export default model<AppInfo>('appInfo', appInfoSchema)

