import mongoose, { Types } from "mongoose";
import path from "path";
import HttpException from "../../exceptions/http.exception";
import logger from "../../services/logger/logger";
import { renameUploadedFile } from "../../services/multers.config";
import organizationModel from "../organization/organization.model";
import {
  Organization,
  OrganizationMember,
  TeamRole,
} from "../organization/organization.protocol";
import userModel from "../user/user.model";
import { User } from "../user/user.protocol";
import { cardDefaultData } from "./card.data";
import cardModel from "./card.model";
import {
  Card,
  CardCatelog,
  CardContactInfo,
  CardSocialMediaLink,
  CardStyle,
  CardTestimony,
  CardType,
  SocialMediaLink,
} from "./card.protocol";

class CardService {
  async createCard(
    user: User,
    data: Partial<Card>,
    cardStyle: CardStyle,
    contactInfo: CardContactInfo,
    cardPhoto?: Express.Multer.File,
    cardCoverPhoto?: Express.Multer.File,
    cardVideo?: Express.Multer.File
  ): Promise<Card> {
    try {
      let socialMediaLinks: CardSocialMediaLink[] = [];
      if (data.socialMediaLinks) {
        try {
          const parsedLinks = JSON.parse(data.socialMediaLinks.toString());

          socialMediaLinks = parsedLinks.map((link: any) => ({
            media: {
              iconUrl: link.media.iconUrl,
              name: link.media.name,
              type: link.media.type,
              link: link.media.link,
            },
            username: link.username,
            active: link.active,
          }));
        } catch (error) {
          throw new HttpException(
            422,
            "invalid",
            `'Invalid social media links format'`
          );
        }
      }

      let newCardPhotoFileName = "";
      if (cardCoverPhoto != null && cardCoverPhoto.destination != null) {
        const cardPhotoDestination = cardPhoto.destination;
        const cardPhotoFileName = cardPhoto.filename;
        const cardFileExt = path.extname(cardPhoto.originalname);
        newCardPhotoFileName = `cardPhoto_${user.id}${cardFileExt}`;
        await renameUploadedFile(
          cardPhotoFileName,
          newCardPhotoFileName,
          cardPhotoDestination
        );
      }
      let newCardCoverPhotoFileName = "";
      if (cardCoverPhoto != null && cardCoverPhoto.destination != null) {
        const cardCoverPhotoDestination = cardCoverPhoto.destination;
        const cardCoverFileName = cardCoverPhoto.filename;
        const coverFileExt = path.extname(cardCoverPhoto.originalname);
        newCardCoverPhotoFileName = `cardCoverPhoto_${user.id}${coverFileExt}`;
        await renameUploadedFile(
          cardCoverFileName,
          newCardCoverPhotoFileName,
          cardCoverPhotoDestination
        );
      }
      let newCardVideoFileName = "";
      if (cardVideo != null && cardVideo.destination != null) {
        const cardVideoDestination = cardVideo.destination;
        const cardVideoFileName = cardVideo.filename;
        const videoFileExt = path.extname(cardVideo.originalname);
        await renameUploadedFile(
          cardVideoFileName,
          newCardVideoFileName,
          cardVideoDestination
        );
      }

      data.cardPictureUrl = newCardPhotoFileName;
      data.cardCoverUrl = newCardCoverPhotoFileName;
      data.videoUrl = newCardVideoFileName;

      const cardData: Partial<Card> = {
        ...cardDefaultData,
        ...data,
        cardType: data.cardType || CardType.Personal,
        creatorId: user.id,
        ownerId: user.id,
        cardStyle: cardStyle,
        testimonials: data.testimonials || [],
        catelogue: data.catelogue || [],
        active: data.active !== undefined ? data.active : true,
        socialMediaLinks: socialMediaLinks || [],
        contactInfo: contactInfo,
      };

      return await cardModel.create(cardData);
    } catch (error) {
      throw new HttpException(500, "create card failed", `${error}`);
    }
  }

  public async createCardForOrganizationMember(
    creator: User,
    ownerId: string,
    data: Partial<Card>
  ): Promise<Card> {
    try {
      if (!data.organizationInfo?.organizationId) {
        throw new HttpException(
          400,
          "Invalid data",
          "Organization information is missing in card data"
        );
      }

      const organizationId = data.organizationInfo.organizationId;
      const org = await organizationModel.findById(organizationId);

      if (!org) {
        throw new HttpException(404, "Not Found", "Organization not found");
      }

      const orgMembers = org.members;

      const creatorMember = await this.#isTeamMember(creator.id, orgMembers);
      const ownerMember = await this.#isTeamMember(ownerId, orgMembers);

      await this.#validateOrganizationRole(org, creatorMember, TeamRole.Lead);

      const cardData: Partial<Card> = {
        ...cardDefaultData,
        ...data,
        cardType: data.cardType || CardType.Personal,
        creatorId: creator.id,
        ownerId: new mongoose.Types.ObjectId(ownerId),
        cardStyle: data.cardStyle || cardDefaultData.cardStyle,
        testimonials: data.testimonials || [],
        catelogue: data.catelogue || [],
        active: data.active !== undefined ? data.active : true,
        updatedAt: new Date(),
      };

      return await cardModel.create(cardData);
    } catch (error) {
      logger.error(
        `Error creating card for organization member: ${error.message}`
      );
      throw new HttpException(400, "Failed to create card", `${error.message}`);
    }
  }

  async getCardById(id: string): Promise<Card | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException(400, "invalid", "Invalid Card ID");
    }
    const card = await cardModel.findById(id);
    return card;
  }

  async getUserCardById(id: string, uid: string): Promise<Card | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException(400, "invalid", "Invalid Card ID");
    }

    const card = await cardModel.findById(id);
    const idUserCard = this.#isOwner(card.ownerId.toString(), uid);
    if (card.cardType !== CardType.Organizational && !idUserCard) {
      throw new HttpException(
        400,
        "invalid",
        "This is above your pay grade. If you think this is a mistake contact admin (admin@wond3rcard.com) please"
      );
    }
    return card;
  }

  async updateCard(id: string, data: Partial<Card>): Promise<Card | null> {
    return await cardModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteCard(cardId: string, uid: string): Promise<Card | null> {
    try {
      if (!cardId) {
        throw new HttpException(400, "missing", "Please provide id");
      }

      const card = await cardModel.findById(cardId);

      if (!card) {
        throw new HttpException(403, "failed", "Card not found");
      }

      const canDelete = this.#isOwner(card.ownerId, uid);

      if (!canDelete) {
        throw new HttpException(
          403,
          "access denied",
          "This is above your pay grade"
        );
      }

      return await cardModel.findByIdAndDelete(cardId);
    } catch (error) {
      throw new HttpException(500, "failed", `${error.message || error}`);
    }
  }

  public async deleteUserOrganizationCard(
    user: User,
    cardId: string,
    organizationId: string
  ): Promise<Card | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(cardId)) {
        throw new HttpException(
          400,
          "Invalid Card ID",
          "Provided card ID is not valid"
        );
      }

      const card = await cardModel.findById(cardId);

      if (!card) {
        throw new HttpException(
          404,
          "Card Not Found",
          "No card found with the given ID"
        );
      }

      if (card.organizationInfo?.organizationId.toString() !== organizationId) {
        throw new HttpException(
          403,
          "Permission Denied",
          "The specified card does not belong to the given organization"
        );
      }

      const organization = await organizationModel.findById(organizationId);

      if (!organization) {
        throw new HttpException(
          404,
          "Organization Not Found",
          "No organization found with the given ID"
        );
      }

      const isAuthorized = organization.members.some(
        (member) =>
          member.memberId === user.id &&
          (member.role === TeamRole.Lead || member.role === TeamRole.Moderator)
      );

      if (!isAuthorized) {
        throw new HttpException(
          403,
          "Permission Denied",
          "Only leads or moderators of the organization can delete organizational cards"
        );
      }

      return await cardModel.findByIdAndDelete(cardId);
    } catch (error) {
      logger.error(`Error deleting organizational card: ${error.message}`);
      throw new HttpException(500, "Failed to delete card", error.message);
    }
  }

  public async getAllUserCards(uid: string): Promise<Card[]> {
    try {
      const cards = await cardModel.find({ ownerId: uid });
      return cards;
    } catch (error) {
      throw new HttpException(400, "failed", "Could not retrieve user cards");
    }
  }

  async getAllCards(): Promise<Card[]> {
    return await cardModel.find();
  }

  public async deleteAllUserCards(
    uid: string
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await cardModel.deleteMany({
        ownerId: uid,
        cardType: { $ne: CardType.Organizational },
      });

      return { deletedCount: result.deletedCount || 0 };
    } catch (error) {
      logger.error(
        `Error deleting all user cards for user ${uid}: ${error.message}`
      );
      throw new HttpException(400, "Failed to delete cards", error.message);
    }
  }

  public async updateUserOrganizationalCard(
    user: User,
    cardId: string,
    data: Partial<Card>
  ): Promise<Card | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(cardId)) {
        throw new HttpException(
          400,
          "Invalid Card ID",
          "Provided card ID is not valid"
        );
      }

      const card = await cardModel.findById(cardId);

      if (!card) {
        throw new HttpException(
          404,
          "Card Not Found",
          "No card found with the given ID"
        );
      }

      if (card.cardType !== CardType.Organizational) {
        throw new HttpException(
          403,
          "Permission Denied",
          "This method can only be used to update organizational cards"
        );
      }

      const organizationId = card.organizationInfo?.organizationId;
      if (!organizationId) {
        throw new HttpException(
          400,
          "Invalid Data",
          "The card does not contain valid organization information"
        );
      }

      const org = await organizationModel.findById(organizationId);
      if (!org) {
        throw new HttpException(
          404,
          "Organization Not Found",
          "No organization found with the given ID"
        );
      }

      const userMember = await this.#isTeamMember(user.id, org.members);
      if (
        !userMember ||
        (userMember.role !== TeamRole.Lead &&
          userMember.role !== TeamRole.Moderator)
      ) {
        throw new HttpException(
          403,
          "Permission Denied",
          "Only users with the role of Lead or Moderator can update organizational cards"
        );
      }

      const updatedCard = await cardModel.findByIdAndUpdate(cardId, data, {
        new: true,
      });
      return updatedCard;
    } catch (error) {
      logger.error(`Error updating organizational card: ${error.message}`);
      throw new HttpException(400, "Failed to update card", error.message);
    }
  }

  public async updateOrgCard(
    user: User,
    cardId: string,
    allowedFields: Partial<Card>
  ): Promise<Card | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(cardId)) {
        throw new HttpException(
          400,
          "Invalid Card ID",
          "Provided card ID is not valid"
        );
      }

      const card = await cardModel.findById(cardId);

      if (!card) {
        throw new HttpException(
          404,
          "Card Not Found",
          "No card found with the given ID"
        );
      }

      if (card.cardType !== CardType.Organizational) {
        throw new HttpException(
          403,
          "Permission Denied",
          "This method can only be used to update organizational cards"
        );
      }

      if (card.ownerId.toString() !== user.id) {
        throw new HttpException(
          403,
          "Permission Denied",
          "Only the owner of the card can update it"
        );
      }

      const allowedUpdates = ["title", "description", "cardDesign"]; // Example of fields that can be updated
      const updates: Partial<Card> = Object.keys(allowedFields).reduce(
        (acc, key) => {
          if (allowedUpdates.includes(key)) {
            acc[key] = allowedFields[key as keyof Card];
          }
          return acc;
        },
        {} as Partial<Card>
      );

      if (Object.keys(updates).length === 0) {
        throw new HttpException(
          400,
          "Invalid Updates",
          "No valid fields to update"
        );
      }

      const updatedCard = await cardModel.findByIdAndUpdate(cardId, updates, {
        new: true,
      });
      return updatedCard;
    } catch (error) {
      logger.error(`Error updating organization card: ${error.message}`);
      throw new HttpException(400, "Failed to update card", error.message);
    }
  }

  public async toggleCardStatus(cardId: string, userId: string): Promise<Card> {
    const cardObjectId = new Types.ObjectId(cardId);

    const card = await cardModel.findOne({ _id: cardId, ownerId: userId });
    if (!card) {
      throw new HttpException(
        419,
        "419",
        "Card not found or you are not authorized to update this card."
      );
    }

    card.active = !card.active;

    const updatedCard = await card.save();

    return updatedCard;
  }

  public async addSocialMediaLink(
    cardId: string,
    userId: string,
    username: string,
    socialMediaLink: SocialMediaLink
  ): Promise<Card> {
    const card = await cardModel.findOne({ _id: cardId, ownerId: userId });
    if (!card) {
      throw new HttpException(
        419,
        "invalid",
        "Card not found or you are not authorized to add to this card."
      );
    }

    card.socialMediaLinks.push({
      media: socialMediaLink,
      username: username,
      active: true,
    });

    const updatedCard = await card.save();
    return updatedCard;
  }

  public async updateSocialMediaLink(
    cardId: string,
    userId: string,
    socialMediaName: string,
    updatedLinkData: Partial<CardSocialMediaLink>
  ): Promise<Card> {
    const card = await cardModel.findOne({ _id: cardId, ownerId: userId });
    if (!card) {
      throw new HttpException(
        419,
        "invalid",
        "Card not found or you are not authorized to update this card."
      );
    }

    const socialMediaLinkIndex = card.socialMediaLinks.findIndex(
      (link) => link.media.name === socialMediaName
    );
    if (socialMediaLinkIndex === -1) {
      throw new HttpException(404, "not found", "Social media link not found.");
    }

    const socialMediaLink = card.socialMediaLinks[socialMediaLinkIndex];
    card.socialMediaLinks[socialMediaLinkIndex] = {
      ...socialMediaLink,
      media: { ...socialMediaLink.media, ...updatedLinkData.media },
      username: updatedLinkData.username ?? socialMediaLink.username,
      active: updatedLinkData.active ?? socialMediaLink.active,
    };

    const updatedCard = await card.save();
    return updatedCard;
  }

  public async deleteSocialMediaLink(
    cardId: string,
    userId: string,
    socialMediaId: string
  ): Promise<Card> {
    const card = await cardModel.findOne({ _id: cardId, ownerId: userId });
    if (!card) {
      throw new HttpException(
        419,
        "not",
        "Card not found or you are not authorized to delete from this card."
      );
    }

    card.socialMediaLinks = card.socialMediaLinks.filter(
      (link) => !(link.media.name === socialMediaId)
    );

    const updatedCard = await card.save();
    return updatedCard;
  }

  public async toggleSocialMediaStatus(
    cardId: string,
    userId: string,
    socialMediaId: string
  ): Promise<Card> {
    const card = await cardModel.findOne({ _id: cardId, ownerId: userId });
    if (!card) {
      throw new HttpException(
        419,
        "error",
        "Card not found or you are not authorized to update this card."
      );
    }

    const socialMediaLink = card.socialMediaLinks.find(
      (link) => link.media.name === socialMediaId
    );
    if (!socialMediaLink) {
      throw new HttpException(404, "not found", "Social media link not found.");
    }

    socialMediaLink.active = !socialMediaLink.active;

    const updatedCard = await card.save();
    return updatedCard;
  }

  public async addTestimony(
    cardId: string,
    userId: string,
    testimony: CardTestimony
  ): Promise<Card> {
    const card = await cardModel.findOne({ _id: cardId });
    if (!card) {
      throw new HttpException(404, "not found", "Card not found.");
    }

    const newTestimony = {
      ...testimony,
      userId: userId,
    };

    card.testimonials.push(newTestimony);

    const updatedCard = await card.save();

    return updatedCard;
  }

  public async deleteTestimony(
    cardId: string,
    userId: string,
    testimonyId: string
  ): Promise<Card> {
    try {
      const cardObjectId = new Types.ObjectId(cardId);
      const testimonyObjectId = new Types.ObjectId(testimonyId);

      const card = await cardModel.findOne({ _id: cardObjectId });
      if (!card) {
        throw new HttpException(404, "not found", "Card not found.");
      }

      const testimonyIndex = card.testimonials.findIndex((testimony) =>
        testimony._id.equals(testimonyObjectId)
      );

      if (testimonyIndex === -1) {
        throw new HttpException(404, "not found", "Testimony not found.");
      }

      card.testimonials.splice(testimonyIndex, 1);

      const updatedCard = await card.save();

      return updatedCard;
    } catch (error) {
      throw new HttpException(500, "Internal server error", error.message);
    }
  }
  #isOwner(ownerId: string | mongoose.Types.ObjectId, uid: string): boolean {
    return ownerId.toString() === uid;
  }

  public async shareCard(
    cardId: string,
    ownerId: string,
    recipientId: string
  ): Promise<Card> {
    try {
      const cardObjectId = new Types.ObjectId(cardId);
      const recipientObjectId = new Types.ObjectId(recipientId);

      const card = await cardModel.findOne({ _id: cardObjectId });
      if (!card) {
        throw new HttpException(404, "not found", "Card not found.");
      }

      // Check if the requesting user is the owner
      if (card.ownerId.toString() !== ownerId) {
        throw new HttpException(
          403,
          "forbidden",
          "You are not authorized to share this card."
        );
      }

      if (ownerId === recipientId) {
        throw new HttpException(
          400,
          "bad request",
          "You cannot share a card with yourself."
        );
      }

      // Check if recipient exists
      const recipient = await userModel.findById(recipientObjectId);
      if (!recipient) {
        throw new HttpException(404, "not found", "Recipient user not found.");
      }

      // Prevent duplicate sharing
      const alreadyShared = card.sharedWith.some((entry) =>
        entry.userId.equals(recipientObjectId)
      );
      if (alreadyShared) {
        throw new HttpException(
          400,
          "bad request",
          "Card already shared with this user."
        );
      }

      // Add recipient to the shared list
      card.sharedWith.push({ userId: recipientObjectId, sharedAt: new Date() });
      const updatedCard = await card.save();

      return updatedCard;
    } catch (error) {
      throw new HttpException(500, "Internal server error", error.message);
    }
  }

  public async addCardCatelogue(
    cardId: string,
    uid: string,
    newCatelog: CardCatelog,
    cateloguePhoto?: Express.Multer.File
  ): Promise<Card> {
    try {
      const cardObjectId = new Types.ObjectId(cardId);

      const card = await cardModel.findOne({ _id: cardObjectId });
      if (!card) {
        throw new HttpException(404, "not found", "Card not found.");
      }

      let newCateloguePhotoFileName = "";
      if (cateloguePhoto != null && cateloguePhoto.destination != null) {
        const cateloguePhotoFileName = cateloguePhoto.filename;
        newCatelog.imageUrl = cateloguePhotoFileName;
      }

      card.catelogue.push(newCatelog);

      const updatedCard = await card.save();

      return updatedCard;
    } catch (error) {
      throw new HttpException(500, "Internal server error", error.message);
    }
  }

  public async updateCardCatelog(
    cardId: string,
    catelogId: string,
    updatedCatelog: CardCatelog
  ): Promise<Card> {
    try {
      const cardObjectId = new Types.ObjectId(cardId);
      const catelogObjectId = new Types.ObjectId(catelogId);

      const card = await cardModel.findOne({ _id: cardId });
      if (!card) {
        throw new HttpException(404, "not found", "Card not found.");
      }

      const catelogIndex = card.catelogue.findIndex((item) =>
        item._id.equals(catelogObjectId)
      );

      if (catelogIndex === -1) {
        throw new HttpException(404, "not found", "Catalog item not found.");
      }

      card.catelogue[catelogIndex] = {
        ...card.catelogue[catelogIndex],
        ...updatedCatelog,
      };

      const updatedCard = await card.save();

      return updatedCard;
    } catch (error) {
      throw new HttpException(500, "Internal server error", error.message);
    }
  }

  public async deleteCardCatelog(
    cardId: string,
    catelogId: string
  ): Promise<Card> {
    try {
      const cardObjectId = new Types.ObjectId(cardId);
      const catelogObjectId = new Types.ObjectId(catelogId);

      const card = await cardModel.findOne({ _id: cardObjectId });
      if (!card) {
        throw new HttpException(404, "not found", "Card not found.");
      }

      const catelogIndex = card.catelogue.findIndex((item) =>
        item._id.equals(catelogObjectId)
      );

      if (catelogIndex === -1) {
        throw new HttpException(404, "not found", "Catalog item not found.");
      }

      card.catelogue.splice(catelogIndex, 1);

      const updatedCard = await card.save();

      return updatedCard;
    } catch (error) {
      throw new HttpException(500, "Internal server error", error.message);
    }
  }

  public async getAllCardCatelog(cardId: string): Promise<CardCatelog[]> {
    try {
      const cardObjectId = new Types.ObjectId(cardId);

      const card = await cardModel.findOne({ _id: cardObjectId });
      if (!card) {
        throw new HttpException(404, "not found", "Card not found.");
      }

      return card.catelogue;
    } catch (error) {
      throw new HttpException(500, "Internal server error", error.message);
    }
  }

  #getCustomizationOptions = (user: any, customization: any): object => {
    return user.userRole !== "normal" ? customization : {};
  };

  #validateTeamLeadAssignment = async (
    user: OrganizationMember,
    assignedTo: string,
    org: Organization
  ): Promise<void> => {
    const isTeamLead = await this.#hasTeamRole(user, org, TeamRole.Lead);
    if (!isTeamLead) {
      throw new HttpException(
        403,
        "Permission denied",
        "Only team leads can create cards for team members within this organization"
      );
    }

    const assignedUser = await userModel.findOne({
      id: assignedTo,
      organizationRoles: {
        $elemMatch: {
          organizationId: org.id,
          role: { $in: ["lead", "member", "moderator"] },
        },
      },
    });

    if (!assignedUser) {
      throw new HttpException(
        400,
        "Invalid assignment",
        "Assigned user must be a team member within the same organization"
      );
    }
  };

  #isTeamMember = async (
    uid: string,
    members: OrganizationMember[]
  ): Promise<OrganizationMember> => {
    if (!uid || !Array.isArray(members)) {
      throw new Error("Invalid parameters: uid and members must be provided");
    }

    const member = members.find((member) => member.memberId === uid);

    if (!member) {
      throw new HttpException(
        404,
        "Not Found",
        "User is not a member of the organization"
      );
    }

    return member;
  };

  #hasTeamRole = async (
    user: OrganizationMember,
    organization: Organization,
    role: TeamRole
  ): Promise<boolean> => {
    const userRole = organization.members.find(
      (member) => member.memberId === user.memberId && member.role === role
    );

    return Boolean(userRole);
  };

  #validateOrganizationRole = async (
    org: Organization,
    creator: OrganizationMember,
    requiredRole: TeamRole
  ): Promise<void> => {
    const hasRole = await this.#hasTeamRole(creator, org, requiredRole);

    if (!hasRole) {
      throw new HttpException(
        403,
        "Permission denied",
        `Only users with the role of ${requiredRole} or higher can perform this action`
      );
    }
  };

  #validateAssignedUser = async (
    ownerId: string,
    organizationId: string
  ): Promise<any> => {
    if (!ownerId || !organizationId) {
      throw new Error(
        "Invalid parameters: ownerId and organizationId are required"
      );
    }

    return await userModel.findOne({
      id: ownerId,
      organizationRoles: {
        $elemMatch: {
          organizationId: organizationId,
        },
      },
    });
  };
}

export default CardService;
