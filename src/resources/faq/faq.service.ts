import { Model } from "mongoose";
import FAQModel from "./faq.model";
import { FAQ } from "./faq.protocol";

class FAQService {
  private model: Model<FAQ>;

  constructor() {
    this.model = FAQModel;
  }

  public async getAllFAQs(category?: string): Promise<FAQ[]> {
    const filter = category ? { category } : {};
    return await this.model.find(filter).exec();
  }

  public async getFAQById(id: string): Promise<FAQ | null> {
    return await this.model.findById(id).exec();
  }

  public async createFAQ(data: FAQ): Promise<FAQ> {
    const newFAQ = new this.model(data);
    return await newFAQ.save();
  }

  public async updateFAQ(id: string, data: Partial<FAQ>): Promise<FAQ | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  public async deleteFAQ(id: string): Promise<FAQ | null> {
    return await this.model.findByIdAndDelete(id).exec();
  }
}

export default FAQService;
