import HttpException from "../../exceptions/http.exception";
import appInfoModel from "./app-info.model";
import AppInfo from "./app-info.protocol";

class AppInfoService {
  private model = appInfoModel
  // Retrieve the current app information
  public async getAppInfo(): Promise<AppInfo> {
    const appInfo = await this.model.findOne();
    if (!appInfo) {
      throw new HttpException(404, 'App Info Not Found', 'No app information is available.');
    }
    return appInfo;
  }

  // Upsert (update or insert) app information
  public async upsertAppInfo(data: Partial<AppInfo>): Promise<AppInfo> {
    const existingAppInfo = await this.model.findOne();

    if (existingAppInfo) {
      // Update existing record
      Object.assign(existingAppInfo, data);
      await existingAppInfo.save();
      return existingAppInfo;
    }

    // Create new record
    const newAppInfo = this.model.create(data);
    // await newAppInfo.save();
    return newAppInfo;
  }

  // Delete app information
  public async deleteAppInfo(): Promise<void> {
    const result = await this.model.deleteOne({});
    if (result.deletedCount === 0) {
      throw new HttpException(404, 'App Info Not Found', 'No app information was found to delete.');
    }
  }
}

export default AppInfoService;
