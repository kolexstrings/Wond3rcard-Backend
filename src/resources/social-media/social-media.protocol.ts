import { Document } from "mongoose";

enum MediaType {
  Social = "social",
  Communication = "communication",
  Portfolio = "portfolio",
  News = "news",
  Entertainment = "entertainment",
  Educational = "educational",
  ECommerce = "e-commerce",
  Gaming = "gaming",
  Productivity = "productivity",
  Fitness = "fitness",
  Travel = "travel",
  Finance = "finance",
}


interface SocialMedia extends Document {
  name: string;
  imageUrl: string;
  link: string;
  mediaType: MediaType;
  description: string;
}

export { MediaType, SocialMedia };

