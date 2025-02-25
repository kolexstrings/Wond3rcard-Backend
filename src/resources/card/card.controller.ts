import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import { canCreateCardMiddleware } from "../../middlewares/card.middlewares";
import validationMiddleware from "../../middlewares/validation.middleware";
import GlobalController from "../../protocols/global.controller";
import {
  uploadCardMediaMiddleware,
  uploadCatelogueMiddleware,
} from "../../services/multers.config";
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

    this.router.get(
      `${this.path}/get-card/:cardId`,
      [authenticatedMiddleware],
      this.getCardById
    );

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

    this.router.get(
      `${this.path}/get-all-cards`,
      [authenticatedMiddleware],
      this.getAllCards
    );

    this.router.patch(
      `${this.path}/toggle-card-status/:cardId`,
      [authenticatedMiddleware],
      this.toggleCardStatus
    );

    this.router.put(
      `${this.path}/add-social-media`,
      [authenticatedMiddleware],
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

    this.router.get(`${this.path}/share-card`, this.shareCard);

    this.router.get(`${this.path}/view-card/:cardId`, this.viewCard);
  }

  private createCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
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
      return res
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
  ): Promise<Response | void> => {
    try {
      const creator = req.user;
      const { ownerId, organizationInfo } = req.body;
      const { organizationId } = organizationInfo;
      const card = await this.cardService.createCardForOrganizationMember(
        creator,
        ownerId,
        req.body
      );
      return res
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
  ): Promise<Response | void> => {
    try {
      const uid = req.user.id;
      const cards = await this.cardService.getAllUserCards(uid);
      if (cards.length === 0) {
        return res.status(404).json({
          statusCode: 404,
          status: "failed",
          message: "You don't have any cards",
        });
      }
      return res.status(200).json({
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
  ): Promise<Response | void> => {
    try {
      const { cardId } = req.params;
      if (!cardId) {
        throw new HttpException(400, "missing", "Please provide id");
      }
      const uid = req.user.id;
      const card = await this.cardService.getUserCardById(cardId, uid);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      return res.json(card);
    } catch (error) {
      next(error);
    }
  };

  private updateCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { cardId } = req.body;
      const card = await this.cardService.updateCard(cardId, req.body);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      return res.json(card);
    } catch (error) {
      next(error);
    }
  };

  private updateOrgCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { cardId } = req.body;
      const user = req.user;
      const card = await this.cardService.updateOrgCard(user, cardId, req.body);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      return res.json(card);
    } catch (error) {
      next(error);
    }
  };

  private updateUserOrgCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      const { cardId } = req.body;
      const card = await this.cardService.updateUserOrganizationalCard(
        user,
        cardId,
        req.body
      );

      return res.json(card);
    } catch (error) {
      next(error);
    }
  };

  private deleteCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { cardId } = req.params;

      const uid = req.user.id;
      const card = await this.cardService.deleteCard(cardId, uid);
      return res
        .status(200)
        .json({ message: "Card deleted", payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private deleteUserOrgCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { cardId, organizationId } = req.body;
      const user = req.user;
      const card = await this.cardService.deleteUserOrganizationCard(
        user,
        cardId,
        organizationId
      );
      return res
        .status(200)
        .json({ message: "Card deleted", payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private deleteAllUserCards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const ownerId = req.user.id;
      const response = await this.cardService.deleteAllUserCards(ownerId);
      return res
        .status(204)
        .json({ message: "All Cards deleted", payload: { response } });
    } catch (error) {
      next(error);
    }
  };

  /// admin only
  private getAllCards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const cards = await this.cardService.getAllCards();
      return res.json(cards);
    } catch (error) {
      next(error);
    }
  };

  private toggleCardStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { cardId } = req.params;

      const uid = req.user.id;
      const card = await this.cardService.toggleCardStatus(cardId, uid);
      return res.status(200).json({
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
  ): Promise<Response | void> => {
    try {
      const { cardId, iconUrl, type, name, username, link } = req.body;
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
        username,
        socialMediaLink
      );
      return res
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
  ): Promise<Response | void> => {
    try {
      const { cardId, iconUrl, type, name, username, link, active } = req.body;

      const socialMediaLink: CardSocialMediaLink = {
        username,
        active,
        media: {
          iconUrl,
          type,
          name,
          link,
        },
      };
      const uid = req.user.id;
      const card = await this.cardService.updateSocialMediaLink(
        cardId,
        uid,
        name,
        socialMediaLink
      );
      return res
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
  ): Promise<Response | void> => {
    try {
      const { cardId, name } = req.body;
      const uid = req.user.id;
      const card = await this.cardService.deleteSocialMediaLink(
        cardId,
        uid,
        name
      );
      return res
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
  ): Promise<Response | void> => {
    try {
      const { cardId, name } = req.body;
      const uid = req.user.id;
      const card = await this.cardService.toggleSocialMediaStatus(
        cardId,
        uid,
        name
      );
      return res
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
  ): Promise<Response | void> => {
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
      return res
        .status(200)
        .json({ message: `Testimony addedd`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private deleteTestimony = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { cardId, testimonyId } = req.body;
      const uid = req.user.id;

      const card = await this.cardService.deleteTestimony(
        cardId,
        uid,
        testimonyId
      );
      return res
        .status(200)
        .json({ message: `Testimony deleted`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private addcatelogue = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
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
      return res
        .status(200)
        .json({ message: `Catelogue added`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private updateCatelogue = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
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
      return res
        .status(200)
        .json({ message: `Catelogue updated`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private deleteCatelogue = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { cardId, catelogueId } = req.body;
      const uid = req.user.id;

      const card = await this.cardService.deleteCardCatelog(
        cardId,
        catelogueId
      );
      return res
        .status(200)
        .json({ message: `Catelogue deleted`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private viewCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { cardId } = req.params;
      if (!cardId) {
        throw new HttpException(400, "missing", "Please provide id");
      }

      const card = await this.cardService.getCardById(cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      return res.json({ card });
    } catch (error) {
      next(error);
    }
  };

  private connectionRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {};
  private acceptConnectionRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {};
  private shareCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {};
}
export default CardController;
