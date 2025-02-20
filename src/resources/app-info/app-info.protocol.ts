interface AppInfo extends Document {
  helpAndSupport: string;
  adminEmail: string;
  contactEmail: string;
  address: string;
  appLogo: string;
  privacyPolicyURL: string;
  termsOfServiceURL: string;
  appVersion: string;
  websiteURL: string;
  appStoreURL: string;
  playStoreURL: string;
  socialMediaLinks: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  maintenanceMode: boolean;
  maintenanceMessage?: string;
}


export default AppInfo