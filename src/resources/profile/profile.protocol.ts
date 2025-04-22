import { ObjectId } from "mongoose";

export interface Profile {
  id: string;
  uid: ObjectId;
  firstname: string;
  othername?: string;
  lastname: string;
  mobileNumber?: string;
  email?: string;
  companyName?: string;
  profileUrl?: string;
  coverUrl?: string;
  designation?: string;
  contacts: string[];
  connections: string[];
  plan: string;
  created_at?: Date;
  updated_at?: Date;
}
