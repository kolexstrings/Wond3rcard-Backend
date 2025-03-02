import HttpException from "../../exceptions/http.exception";
import { deleteFileIfExists } from "../../services/multers.config";
import socialMediaModel from "./social-media.model";
import { SocialMedia } from "./social-media.protocol";

class SocialMediaService {
  private model = socialMediaModel;

  public async getAll(): Promise<SocialMedia[]> {
    try {
      const socialMedias = await this.model.find();
      return socialMedias;
    } catch (error) {
      throw new HttpException(
        500,
        "error",
        "Unable to retrieve social media links"
      );
    }
  }

  public async getById(id: string): Promise<SocialMedia> {
    try {
      const socialMedia = await this.model.findById(id);
      if (!socialMedia) {
        throw new HttpException(
          404,
          "not_found",
          "Social media link not found"
        );
      }
      return socialMedia;
    } catch (error) {
      throw new HttpException(500, "error", "Error fetching social media link");
    }
  }

  private async create(
    name: string,
    imageUrl: string,
    mediaType: string
  ): Promise<SocialMedia> {
    try {
      const socialMedia = await this.model.create({
        name,
        imageUrl,
        mediaType,
      });
      return socialMedia;
    } catch (error) {
      if (error.code === 11000 && error.keyValue?.name) {
        throw new HttpException(
          400,
          "failed",
          `Media already existed with the same name: ${error.keyValue?.name}`
        );
      }
      throw new HttpException(500, "failed", `${error.message || error}`);
    }
  }

  public async checkAndUpdateOrCreate(
    name: string,
    imageUrl: string,
    mediaType: string
  ): Promise<SocialMedia> {
    try {
      return await this.model.findOneAndUpdate(
        { name, mediaType },
        { imageUrl },
        { new: true, upsert: true, runValidators: true }
      );
    } catch (error) {
      if (error.code === 11000 && error.keyValue?.name) {
        throw new HttpException(
          400,
          "failed",
          `Media already existed with the same name: ${error.keyValue?.name}`
        );
      }
      throw new HttpException(500, "failed", `${error.message || error}`);
    }
  }

  public async update(
    id: string,
    updates: Partial<SocialMedia>
  ): Promise<SocialMedia> {
    try {
      const socialMedia = await this.model.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      if (!socialMedia) {
        throw new HttpException(
          404,
          "not_found",
          "Social media link not found"
        );
      }

      return socialMedia;
    } catch (error) {
      throw new HttpException(
        500,
        "error",
        "Unable to update social media link"
      );
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      const socialMedia = await this.model.findByIdAndDelete(id);
      await deleteFileIfExists(socialMedia.name);
      if (!socialMedia) {
        throw new HttpException(
          404,
          "not_found",
          "Social media link not found"
        );
      }
    } catch (error) {
      throw new HttpException(
        500,
        "error",
        "Unable to delete social media link"
      );
    }
  }
}

export default SocialMediaService;
