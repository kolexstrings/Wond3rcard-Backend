import { featureFlagModel } from "./feature-flag.model";
import { IFeatureFlag } from "./feature-flags.protocol";


class FeatureFlagService {
  public async createFeatureFlag(data: Partial<IFeatureFlag>): Promise<IFeatureFlag> {
    const featureFlag = new featureFlagModel(data);
    return await featureFlag.save();
  }

  public async getFeatureFlag(name: string): Promise<IFeatureFlag | null> {
    return await featureFlagModel.findOne({ name });
  }

  public async updateFeatureFlag(data: Partial<IFeatureFlag>): Promise<IFeatureFlag | null> {
    const name = data.name
    return await featureFlagModel.findOneAndUpdate({ name }, data, { new: true });
  }

  public async deleteFeatureFlag(name: string): Promise<IFeatureFlag | null> {
    return await featureFlagModel.findOneAndDelete({ name });
  }

  public async listFeatureFlags(): Promise<IFeatureFlag[]> {
    return await featureFlagModel.find();
  }

  public async isFeatureEnabled(name: string): Promise<boolean> {
    const featureFlag = await featureFlagModel.findOne({ name });
    return featureFlag?.enabled ?? false;
  }
}

export default FeatureFlagService;
