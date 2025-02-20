import { Types } from "mongoose";

enum InteractionType {
  View = "view",
  Share = "share",
  Save = "save",
  Phone = "phone",
  Email = "email",
  Contact = "contact",
  Connection = "connection",
  QRCode = "qr-code",
  SocialLink = "social-link",
}

// Define interfaces for the data structures
interface Geolocation {
  ip: string;
  network: string;
  version: string;
  city: string;
  region: string;
  region_code: string;
  country: string;
  country_name: string;
  country_code: string;
  country_code_iso3: string;
  country_capital: string;
  country_tld: string;
  continent_code: string;
  in_eu: boolean;
  postal: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utc_offset: string;
  country_calling_code: string;
  currency: string;
  currency_name: string;
  languages: string;
  country_area: number;
  country_population: number;
  asn: string;
  org: string;
}

// Define a default Geolocation object
const defaultGeoData: Geolocation = {
  ip: '',
  network: '',
  version: 'IPv4',
  city: '',
  region: '',
  region_code: '',
  country: '',
  country_name: '',
  country_code: '',
  country_code_iso3: '',
  country_capital: '',
  country_tld: '',
  continent_code: '',
  in_eu: false,
  postal: '',
  latitude: 0,
  longitude: 0,
  timezone: '',
  utc_offset: '',
  country_calling_code: '',
  currency: '',
  currency_name: '',
  languages: '',
  country_area: 0,
  country_population: 0,
  asn: '',
  org: '',
};

interface DeviceInfo {
  agent: string;
  os: string;
  device: string;
}

interface Interactor {
  isWonderCardUser: Boolean;
  uid: string;
  fullName: string;
}

interface Interaction {
  id: string;
  cardId: Types.ObjectId;
  cardOwnerId: Types.ObjectId;
  interactionType: InteractionType;
  ipAddress: string;
  geolocation: Geolocation | null;
  deviceInfo: DeviceInfo;
  interactor: Interactor
  createdAt: Date;
  updatedAt: Date;
}

export { defaultGeoData, DeviceInfo, Geolocation, Interaction, InteractionType, Interactor };

