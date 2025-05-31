import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import { canCreateCardMiddleware } from "../../middlewares/card.middlewares";
import validationMiddleware from "../../middlewares/validation.middleware";
import GlobalController from "../../protocols/global.controller";
import { uploadCatelogueMiddleware } from "../../middlewares/uploaders/uploadCatalogueImages";
import { uploadCardMediaMiddleware } from "../../middlewares/uploaders/uploadCardMedia";
import {
  AddressInfo,
  CardCatelog,
  CardContactInfo,
  CardSocialMediaLink,
  CardStyle,
  CardTestimony,
  SocialMediaLink,
} from "./card.protocol";
import CardService from "./card.service";
import validator from "./card.validator";

class CardController implements GlobalController {
  public path = "/cards";
  public router = Router();
  private cardService = new CardService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.get(
      `${this.path}`,
      authenticatedMiddleware,
      this.retrieveUserCards
    );

    this.router.put(
      `${this.path}/create`,
      [
        authenticatedMiddleware,
        uploadCardMediaMiddleware,
        canCreateCardMiddleware,
      ],
      this.createCard
    );

    this.router.put(
      `${this.path}/create-team`,
      [
        authenticatedMiddleware,
        canCreateCardMiddleware,
        validationMiddleware(validator.validateCreateTeamMemberCard),
      ],
      this.createTeamMemberCard
    );

    this.router.get(`${this.path}/get-card/:cardId`, this.getCardById); // we can use an authentication token for guests for this later

    this.router.delete(
      `${this.path}/delete-all-cards`,
      [authenticatedMiddleware],
      this.deleteAllUserCards
    );

    this.router.patch(
      `${this.path}/update-card`,
      [authenticatedMiddleware, validationMiddleware(validator.updateCard)],
      this.updateCard
    );

    this.router.patch(
      `${this.path}/update-org-card`,
      [authenticatedMiddleware, validationMiddleware(validator.updateCard)],
      this.updateOrgCard
    );

    this.router.patch(
      `${this.path}/update-user-org-card`,
      [authenticatedMiddleware, validationMiddleware(validator.updateCard)],
      this.updateUserOrgCard
    );

    this.router.delete(
      `${this.path}/delete-card/:cardId`,
      [authenticatedMiddleware],
      this.deleteCard
    );

    this.router.delete(
      `${this.path}/delete-user-org-card/`,
      [
        authenticatedMiddleware,
        validationMiddleware(validator.deleteUserOrgCard),
      ],
      this.deleteUserOrgCard
    );

    this.router.patch(
      `${this.path}/toggle-card-status/:cardId`,
      [authenticatedMiddleware],
      this.toggleCardStatus
    );

    this.router.put(
      `${this.path}/add-social-media`,
      [
        authenticatedMiddleware,
        validationMiddleware(validator.socialMediaLinkSchema),
      ],
      this.addSocialMediaLink
    );

    this.router.patch(
      `${this.path}/update-social-media`,
      [authenticatedMiddleware],
      this.updateSocialMediaLink
    );

    this.router.delete(
      `${this.path}/delete-social-media`,
      [authenticatedMiddleware],
      this.deleteSocialMediaLink
    );

    this.router.patch(
      `${this.path}/toggle-social-media`,
      [authenticatedMiddleware],
      this.toggleSocialMediaStatus
    );

    this.router.put(
      `${this.path}/add-testimony`,
      [authenticatedMiddleware],
      this.addTestimony
    );

    this.router.delete(
      `${this.path}/delete-testimony`,
      [authenticatedMiddleware],
      this.deleteTestimony
    );
    this.router.put(
      `${this.path}/add-catelogue`,
      [authenticatedMiddleware, uploadCatelogueMiddleware],
      this.addcatelogue
    );

    this.router.patch(
      `${this.path}/update-catelogue`,
      [authenticatedMiddleware],
      this.updateCatelogue
    );

    this.router.delete(
      `${this.path}/delete-catelogue`,
      [authenticatedMiddleware],
      this.deleteCatelogue
    );

    this.router.get(`${this.path}/connection-request`, this.connectionRequest);

    this.router.get(
      `${this.path}/accept-connection-request`,
      this.acceptConnectionRequest
    );

    this.router.post(
      `${this.path}/share/:cardId`,
      [
        authenticatedMiddleware,
        validationMiddleware(validator.validateShareCard),
      ],
      this.shareCard
    );

    this.router.post(
      `${this.path}/qr/:cardId`,
      authenticatedMiddleware,
      this.generateQrShareLink
    );

    this.router.get(`${this.path}/view-card/:cardId`, this.viewCard);
  }

  private createCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;

      const cardPhoto = req.files?.["cardPhoto"]?.[0];
      const cardCoverPhoto = req.files?.["cardCoverPhoto"]?.[0];
      const cardVideo = req.files?.["cardVideo"]?.[0];

      const style: CardStyle = {
        fontSize: req.body.fontSize || "18px",
        fontStyle: req.body.fontStyle || "normal",
        fontWeight: req.body.fontWeight || "normal",
        textAlign: req.body.textAlign || "left",
        textColor: req.body.textColor || "#000000",
        borderStyle: req.body.borderStyle || "none",
        borderColor: req.body.borderColor || "#000000",
        borderWidth: req.body.borderWidth || "0px",
        borderRadius: req.body.borderRadius || "0px",
        padding: req.body.padding || "10px",
        margin: req.body.margin || "15px",
        orientation: req.body.orientation || "horizontal",
        alignment: req.body.alignment || "leading",
        boxShadow: req.body.boxShadow || "none",
        primaryColor: req.body.primaryColor || "#FFFFFF",
        secondaryColor: req.body.secondaryColor || "#000000",
      };

      let cardAddresses: AddressInfo[] = [];
      if (req.body.addresses) {
        try {
          const parsedLinks = JSON.parse(req.body.addresses.toString());

          cardAddresses = parsedLinks.map((address: any) => ({
            latitude: address.latitude,
            longitude: address.longitude,
            country: address.country,
            state: address.state,
            city: address.city,
            label: address.label,
            street: address.street,
          }));
        } catch (error) {
          throw new HttpException(
            422,
            "invalid",
            `'Invalid social media links format'`
          );
        }
      }

      const contactInfo: CardContactInfo = {
        email: req.body.email,
        emailType: req.body.emailType,
        phone: req.body.phone,
        website: req.body.website,
        addresses: cardAddresses || [],
      };

      const card = await this.cardService.createCard(
        user,
        req.body,
        style,
        contactInfo,
        cardPhoto,
        cardCoverPhoto,
        cardVideo
      );
      res
        .status(201)
        .json({ message: "card created successfully", payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private createTeamMemberCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const creator = req.user;
      const { ownerId, organizationInfo } = req.body;
      const { organizationId } = organizationInfo;
      const card = await this.cardService.createCardForOrganizationMember(
        creator,
        ownerId,
        req.body
      );
      res
        .status(201)
        .json({ message: "Card created successfully", payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private retrieveUserCards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const uid = req.user.id;
      const cards = await this.cardService.getAllUserCards(uid);
      if (cards.length === 0) {
        res.status(404).json({
          statusCode: 404,
          status: "failed",
          message: "You don't have any cards",
        });
      }
      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Cards retrieved successfully",
        payload: { cards },
      });
    } catch (error) {
      next(error);
    }
  };

  private getCardById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;
      if (!cardId) {
        throw new HttpException(400, "missing", "Please provide id");
      }
      const uid = req.user.id;
      const card = await this.cardService.getUserCardById(cardId, uid);
      if (!card) {
        res.status(404).json({ message: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      next(error);
    }
  };

  private updateCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const cardPhoto = req.files?.["cardPhoto"]?.[0];
    const cardCoverPhoto = req.files?.["cardCoverPhoto"]?.[0];
    const cardVideo = req.files?.["cardVideo"]?.[0];

    try {
      const { cardId } = req.body;
      let cardAddresses: AddressInfo[] = [];
      if (req.body.addresses) {
        cardAddresses = JSON.parse(req.body.addresses.toString());
      }

      const data = {
        ...req.body,
        cardPictureUrl: cardPhoto?.path,
        cardCoverUrl: cardCoverPhoto?.path,
        videoUrl: cardVideo?.path,
      };

      const card = await this.cardService.updateCard(cardId, data);

      if (!card) {
        res.status(404).json({ message: "Card not found" });
      }

      res.json(card);
    } catch (error) {
      next(error);
    }
  };

  private updateOrgCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.body;
      const user = req.user;
      const card = await this.cardService.updateOrgCard(user, cardId, req.body);
      if (!card) {
        res.status(404).json({ message: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      next(error);
    }
  };

  private updateUserOrgCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      const { cardId } = req.body;
      const card = await this.cardService.updateUserOrganizationalCard(
        user,
        cardId,
        req.body
      );

      res.json(card);
    } catch (error) {
      next(error);
    }
  };

  private deleteCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;

      const uid = req.user.id;
      const card = await this.cardService.deleteCard(cardId, uid);
      res.status(200).json({ message: "Card deleted", payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private deleteUserOrgCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, organizationId } = req.body;
      const user = req.user;
      const card = await this.cardService.deleteUserOrganizationCard(
        user,
        cardId,
        organizationId
      );
      res.status(200).json({ message: "Card deleted", payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private deleteAllUserCards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const ownerId = req.user.id;
      const response = await this.cardService.deleteAllUserCards(ownerId);
      res
        .status(204)
        .json({ message: "All Cards deleted", payload: { response } });
    } catch (error) {
      next(error);
    }
  };

  private toggleCardStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;

      const uid = req.user.id;
      const card = await this.cardService.toggleCardStatus(cardId, uid);
      res.status(200).json({
        message: `Card ${card.active ? `activated` : `deactivated`}`,
        payload: { card },
      });
    } catch (error) {
      next(error);
    }
  };
  private addSocialMediaLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, iconUrl, type, name, link } = req.body;
      const socialMediaLink: SocialMediaLink = {
        iconUrl,
        type,
        name,
        link,
      };
      const uid = req.user.id;
      const card = await this.cardService.addSocialMediaLink(
        cardId,
        uid,
        socialMediaLink
      );
      res
        .status(200)
        .json({ message: ` social media added`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private updateSocialMediaLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, iconUrl, type, name, link, active } = req.body;

      const socialMediaLink: CardSocialMediaLink = {
        media: {
          iconUrl,
          type,
          name,
          link,
        },
        active,
      };
      const uid = req.user.id;
      const card = await this.cardService.updateSocialMediaLink(
        cardId,
        uid,
        name,
        socialMediaLink
      );
      res
        .status(200)
        .json({ message: `Social media updated`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private deleteSocialMediaLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, link } = req.body;
      const uid = req.user.id;
      const card = await this.cardService.deleteSocialMediaLink(
        cardId,
        uid,
        link
      );
      res
        .status(200)
        .json({ message: `Social media deleted`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private toggleSocialMediaStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, name } = req.body;
      const uid = req.user.id;
      const card = await this.cardService.toggleSocialMediaStatus(
        cardId,
        uid,
        name
      );
      res
        .status(200)
        .json({ message: `Social media status toggled`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private addTestimony = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, name, designation, company, testimony } = req.body;

      const uid = req.user.id;
      const cardTestimony: CardTestimony = {
        name,
        designation,
        company,
        testimony,
        userId: uid,
      };
      const card = await this.cardService.addTestimony(
        cardId,
        uid,
        cardTestimony
      );
      res.status(200).json({ message: `Testimony added`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private deleteTestimony = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, testimonyId } = req.body;
      const uid = req.user.id;

      const card = await this.cardService.deleteTestimony(
        cardId,
        uid,
        testimonyId
      );
      res.status(200).json({ message: `Testimony deleted`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private addcatelogue = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, title, imageUrl, description } = req.body;
      const cateloguePhoto = req.file;

      const uid = req.user.id;
      const catelogue: CardCatelog = {
        title,
        imageUrl,
        description,
      };

      const card = await this.cardService.addCardCatelogue(
        cardId,
        uid,
        catelogue,
        cateloguePhoto
      );
      res.status(200).json({ message: `Catelogue added`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private updateCatelogue = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, catelogId, title, imageUrl, description } = req.body;
      const uid = req.user.id;
      const catelogue: CardCatelog = {
        title,
        imageUrl,
        description,
      };

      const card = await this.cardService.updateCardCatelog(
        cardId,
        catelogId,
        catelogue
      );
      res.status(200).json({ message: `Catelogue updated`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private deleteCatelogue = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, catelogueId } = req.body;
      const uid = req.user.id;

      const card = await this.cardService.deleteCardCatelog(
        cardId,
        catelogueId
      );
      res.status(200).json({ message: `Catelogue deleted`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private shareCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;
      const { recipientId } = req.body;

      if (!cardId || !recipientId) {
        throw new HttpException(
          400,
          "missing",
          "Card ID and Recipient ID are required"
        );
      }

      const uid = req.user.id;

      const updatedCard = await this.cardService.shareCard(
        cardId,
        uid,
        recipientId
      );

      // Generate shareable link
      const baseUrl = process.env.FRONTEND_BASE_URL;
      const shareableLink = `${baseUrl}/#/view-card/${cardId}`;

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Card shared successfully",
        payload: { updatedCard, shareableLink },
      });
    } catch (error) {
      next(error);
    }
  };

  private generateQrShareLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;

      if (!cardId) {
        throw new HttpException(400, "missing", "Card ID is required");
      }

      // Ensure the card exists
      const card = await this.cardService.getCardById(cardId);
      if (!card) {
        throw new HttpException(404, "not_found", "Card not found");
      }

      // Generate public shareable link (no recipient required)
      const baseUrl = process.env.FRONTEND_BASE_URL;
      const qrShareableLink = `${baseUrl}/#/view-card/${cardId}`;

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "QR share link generated successfully",
        payload: { qrShareableLink },
      });
    } catch (error) {
      next(error);
    }
  };

  private viewCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;
      if (!cardId) {
        throw new HttpException(400, "missing", "Please provide id");
      }

      const card = await this.cardService.getCardById(cardId);
      if (!card) {
        res.status(404).json({ message: "Card not found" });
      }
      res.json({ card });
    } catch (error) {
      next(error);
    }
  };

  private connectionRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {};
  private acceptConnectionRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {};
}
export default CardController;
