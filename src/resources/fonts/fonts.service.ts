import HttpException from "../../exceptions/http.exception";
import { deleteFileIfExists } from "../../services/multers.config";
import fontModel from "./font.model";
import { Font } from "./font.protocol";

class FontsService {
  private model = fontModel;


  public async getAllFonts(): Promise<Font[]> {
    try {
      const fonts = await this.model.find()
      return fonts
    } catch (error) {
      throw new HttpException(500, 'error', `${error}`);
    }
  }

  private async create(name: string, url: string, style: string): Promise<Font> {
    try {
      const newFont = new this.model({
        name: name,
        style: style,
        url: url,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return await newFont.save();
    } catch (error) {
      throw new HttpException(500, 'error', 'Error creating font');
    }
  }

  public async checkAndUpdateOrUpload(name: string, style: string, url: string): Promise<Font> {
    try {
      const existingFont = await this.model.findOne({ name, style, url });
      if (existingFont) {
        existingFont.url = url;
        await existingFont.save();
        return existingFont;
      } else {
        return this.create(name, url, style);
      }
    } catch (error) {
      throw new HttpException(500, "error", "Error checking or updating social media link");
    }
  }

  public async update(updates: Partial<Font>): Promise<Font> {
    try {
      const font = await this.model.findByIdAndUpdate(updates.id, updates, {
        new: true,
        runValidators: true,
      });

      if (!font) {
        throw new HttpException(404, "not_found", "Font link not found");
      }

      return font;
    } catch (error) {
      throw new HttpException(500, "error", "Unable to update Font link");
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      const font = await this.model.findByIdAndDelete(id);
      deleteFileIfExists(font.url);
      if (!font) {
        throw new HttpException(404, "not_found", "Social media link not found");
      }
    } catch (error) {
      throw new HttpException(500, "error", "Unable to delete social media link");
    }
  }
}

export default FontsService