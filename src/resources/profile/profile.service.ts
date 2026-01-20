import { Express } from "express";
import HttpException from "../../exceptions/http.exception";
import profileModel from "./profile.model";
import { Profile } from "./profile.protocol";
import userModel from "../user/user.model";

class ProfileService {
  private model = profileModel;
  public async createProfile(data: Profile): Promise<Profile> {
    try {
      const customer = await this.model.create(data);
      return customer;
    } catch (error) {
      throw new Error(`Error creating customer: ${error}`);
    }
  }

  public async getProfileById(id: number): Promise<Profile | null> {
    try {
      const customer = await this.model.findById(id);
      return customer;
    } catch (error) {
      throw new Error(`Error retrieving customer with ID ${id}: ${error}`);
    }
  }

  public async getAllProfiles(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ customers: Profile[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const customers = await this.model.find().skip(skip).limit(limit);
      const total = await this.model.countDocuments();
      return { customers, total };
    } catch (error) {
      throw new Error(`Error retrieving customers: ${error}`);
    }
  }

  public async updateProfile(
    id: number,
    data: Partial<Profile>,
  ): Promise<Profile | null> {
    try {
      const updatedCustomer = await this.model.findByIdAndUpdate(id, data, {
        new: true,
      });
      return updatedCustomer;
    } catch (error) {
      throw new Error(`Error updating customer with ID ${id}: ${error}`);
    }
  }

  public async getOwnProfile(uid: string): Promise<Profile> {
    const profile = await this.model.findOne({ uid });

    if (!profile) {
      throw new HttpException(404, "not_found", "Profile not found");
    }

    return profile;
  }

  public async updateOwnProfile(
    uid: string,
    data: Partial<Profile>,
    profilePhoto?: Express.Multer.File,
    coverPhoto?: Express.Multer.File,
  ): Promise<Profile> {
    type EditableProfileFields = Pick<
      Profile,
      | "firstname"
      | "othername"
      | "lastname"
      | "mobileNumber"
      | "companyName"
      | "designation"
      | "profileUrl"
      | "coverUrl"
    >;

    const allowedFields: (keyof EditableProfileFields)[] = [
      "firstname",
      "othername",
      "lastname",
      "mobileNumber",
      "companyName",
      "designation",
      "profileUrl",
      "coverUrl",
    ];

    const updatePayload: Partial<EditableProfileFields> = {};
    allowedFields.forEach((field) => {
      const value = data[field];
      if (value !== undefined) {
        updatePayload[field] = value as EditableProfileFields[typeof field];
      }
    });

    if (profilePhoto?.path) {
      updatePayload.profileUrl = profilePhoto.path;
    }

    if (coverPhoto?.path) {
      updatePayload.coverUrl = coverPhoto.path;
    }

    const updatedProfile = await this.model.findOneAndUpdate(
      { uid },
      { $set: updatePayload },
      { new: true, runValidators: true },
    );

    if (!updatedProfile) {
      throw new HttpException(404, "not found", "User profile not found");
    }

    return updatedProfile;
  }

  public async deleteProfile(id: number): Promise<Profile | null> {
    try {
      const deletedCustomer = await this.model.findByIdAndDelete(id);
      return deletedCustomer;
    } catch (error) {
      throw new Error(`Error deleting customer with ID ${id}: ${error}`);
    }
  }

  public async getContacts(userId: string): Promise<Profile[]> {
    const user = await this.model.findOne({ uid: userId }).populate("contacts");
    if (!user) {
      throw new HttpException(404, "not found", "User not found");
    }
    const contacts = await Promise.all(
      user.contacts.map(async (contactId) => {
        const profile = await this.model.findById(contactId, {
          contacts: 0,
          connections: 0,
        }); // Fetch the full profile
        if (!profile) {
          throw new HttpException(
            404,
            "not found",
            `Profile not found for contact ID ${contactId}`,
          );
        }
        return profile;
      }),
    );

    return contacts;
  }

  public async addContact(
    userId: string,
    contactEmail: string,
  ): Promise<Profile> {
    const user = await this.model.findOne({ uid: userId });
    const contact = await this.model.findOne({ email: contactEmail });

    if (!user || !contact) {
      throw new HttpException(404, "not found", "User or contact not found");
    }

    if (!user.contacts.includes(contact.id)) {
      user.contacts.push(contact.id);
      await user.save();
    }

    return user;
  }

  public async connect(uid: string, userId: string): Promise<Profile> {
    const target = await this.model.findOne({ uid: userId });
    const user = await this.model.findOne({ uid: uid });

    if (!user || !target) {
      throw new HttpException(404, "not found", "User or target not found");
    }

    if (!user.connections.includes(target.id)) {
      user.connections.push(target.id);
      await user.save();

      target.connections.push(user.id);
      await target.save();
    }

    return user;
  }

  public async getConnections(userId: string): Promise<Profile[]> {
    const profile = await this.model
      .findOne({ uid: userId })
      .populate("connections");
    if (!profile) {
      throw new HttpException(404, "not found", "User not found");
    }

    const connections = await Promise.all(
      profile.connections.map(async (id) => {
        const profile = await this.model.findById(id, {
          contacts: 0,
          connections: 0,
        }); // Fetch the full profile
        if (!profile) {
          throw new HttpException(
            404,
            "not found",
            `Profile not found for contact ID ${id}`,
          );
        }
        return profile;
      }),
    );
    return connections;
  }

  public async suggestConnections(userId: string): Promise<Profile[]> {
    const user = await this.model.findOne({ uid: userId }).populate("contacts");
    if (!user) {
      throw new HttpException(404, "not found", "User not found");
    }

    // const contacts = user.contacts as Profile[];
    const contacts = await Promise.all(
      user.contacts.map(async (contactId) => {
        const profile = await this.model.findById(contactId, {
          contacts: 0,
          connections: 0,
        }); // Fetch the full profile
        if (!profile) {
          throw new HttpException(
            404,
            "not found",
            `Profile not found for contact ID ${contactId}`,
          );
        }
        return profile;
      }),
    );

    const exclusionIds = [user._id, ...contacts.map((contact) => contact._id)];
    const activeUserIds = await userModel
      .find({ isSoftDeleted: false }, "_id")
      .lean()
      .then((users) => users.map((item) => item._id));

    const suggestions = await this.model.find({
      uid: { $in: activeUserIds },
      _id: { $nin: exclusionIds },
    });

    return suggestions;
  }

  // Remove a contact from a user
  public async removeContact(
    userId: string,
    contactId: string,
  ): Promise<Profile> {
    const user = await this.model.findOne({ uid: userId });
    const contact = await this.model.findById(contactId);

    if (!user || !contact) {
      throw new HttpException(404, "not found", "User or contact not found");
    }

    // Remove the contact if it exists in the user's contacts
    user.contacts = user.contacts.filter(
      (id) => id.toString() !== contact.id.toString(),
    );
    await user.save();

    return user;
  }

  public async removeConnection(
    userId: string,
    targetId: string,
  ): Promise<Profile> {
    const user = await this.model.findOne({ uid: userId });
    const target = await this.model.findOne({ uid: targetId });

    if (!user || !target) {
      throw new HttpException(404, "not found", "User or target not found");
    }

    user.connections = user.connections.filter(
      (id) => id.toString() !== target.id.toString(),
    );
    await user.save();

    target.connections = target.connections.filter(
      (id) => id.toString() !== user.id.toString(),
    );
    await target.save();

    return user;
  }
}

export default ProfileService;
