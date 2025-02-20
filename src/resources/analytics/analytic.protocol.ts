import { IncomingHttpHeaders } from "http";

enum AnalyticType {
  View = "View",
  Share = "Share",
  Tapped = "Tapped"
}

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


interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
}

interface AnalyticsData {
  ipAddress: string;
  geolocation: Geolocation | null;
  deviceInfo: DeviceInfo;
  timestamp: Date;
}

interface ResponseData {
  statusCode: number;
  statusMessage: string;
  responseTime: number;
  headers: { [key: string]: string | string[] | number | undefined };
}

interface AnalyticUser {
  isWonderCardUser: Boolean;
  uid: string;
  fullName: string;
}

interface Analytic {
  method: string;
  url: string;
  body: any;
  headers: IncomingHttpHeaders;
  response?: ResponseData;
  ipAddress: string;
  geolocation: Geolocation;
  deviceInfo: DeviceInfo;
  analyticUser: AnalyticUser;
  timestamp: Date;
}


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


export { Analytic, AnalyticsData, AnalyticUser, defaultGeoData, DeviceInfo, Geolocation, ResponseData };

