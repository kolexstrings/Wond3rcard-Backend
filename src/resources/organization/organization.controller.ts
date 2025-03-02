import { NextFunction, Request, Response, Router } from "express";

import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";

import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import validationMiddleware from "../../middlewares/validation.middleware";
import GeneralController from "../../protocols/global.controller";
import userModel from "../user/user.model";
import { UserRole } from "../user/user.protocol";
import OrganizationService from "./organization.service";
import validator from "./organization.validations";

class OrganizationController implements GeneralController {
  public path = "/organizations";
  public router = Router();
  private orgService = new OrganizationService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.get(
      `${this.path}/`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getAllOrganizations
    );

    this.router.post(
      `${this.path}/create`,
      validationMiddleware(validator.createOrgValidator),
      authenticatedMiddleware,
      this.createNewOrganization
    );

    this.router.get(
      `${this.path}/user-organizations`,
      authenticatedMiddleware,
      this.getUserOrganizations
    );

    this.router.post(
      `${this.path}/add-member`,
      validationMiddleware(validator.addMemberValidator),
      authenticatedMiddleware,
      this.addMemberToOrganization
    );

    this.router.get(
      `${this.path}/:orgId/members`,
      [authenticatedMiddleware],
      this.getOrganizationMembers
    );

    this.router.patch(
      `${this.path}/:orgId/change-role`,
      [
        authenticatedMiddleware,
        validationMiddleware(validator.changeRoleValidator),
      ],
      this.changeMemberRole
    );

    this.router.delete(
      `${this.path}/:orgId/remove-member`,
      [
        authenticatedMiddleware,
        validationMiddleware(validator.removeMemberValidator),
      ],
      this.removeMember
    );

    this.router.delete(
      `${this.path}/:orgId/delete`,
      [authenticatedMiddleware],
      this.deleteOrganization
    );

    this.router.patch(
      `${this.path}/:orgId/update`,
      [
        authenticatedMiddleware,
        validationMiddleware(validator.updateOrganizationValidator),
      ],
      this.updateOrganization
    );
  }

  private createNewOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { name, members } = req.body;
      const creatorId = req.user.id;

      const org = await this.orgService.createOrganization(
        creatorId,
        name,
        members
      );

      res.status(201).json({
        statusCode: 201,
        status: "success",
        message: "Organization created successfully",
        payload: org,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  private addMemberToOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { memberId, organizationId, role } = req.body;

      if (!memberId || !organizationId || !role) {
        throw new HttpException(
          400,
          "Bad Request",
          "Missing required fields: memberId, organizationId, or role"
        );
      }

      const updatedOrganization = await this.orgService.addMemberToOrganization(
        organizationId,
        memberId,
        role
      );

      const user = await userModel.findById(memberId);
      if (!user) {
        throw new HttpException(
          404,
          "User not found",
          "The specified user does not exist"
        );
      }

      if (!user.organizations.includes(organizationId)) {
        user.organizations.push(organizationId);
        await user.save();
      }

      return res.status(200).json({
        statusCode: 200,
        status: "success",
        message:
          "Member added successfully and user's organizations list updated",
        payload: updatedOrganization,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  private getOrganizationMembers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { orgId } = req.params;
      const members = await this.orgService.getMembersOfOrganization(orgId);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Members retrieved successfully",
        payload: members,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  private getUserOrganizations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const userId = req.user.id;
      const organizations = await this.orgService.getUserOrganizations(userId);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Organizations retrieved successfully",
        payload: organizations,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  private changeMemberRole = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { orgId } = req.params;
      const { memberId, newRole } = req.body;

      const updatedOrganization = await this.orgService.changeMemberRole(
        orgId,
        memberId,
        newRole
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Member role updated successfully",
        payload: updatedOrganization,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  private removeMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { orgId } = req.params;
      const { memberId } = req.body;

      const updatedOrganization = await this.orgService.removeMember(
        orgId,
        memberId
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Member removed successfully",
        payload: updatedOrganization,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  private deleteOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { orgId } = req.params;

      await this.orgService.deleteOrganization(orgId);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Organization deleted successfully",
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  private updateOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { orgId } = req.params;
      const updates = req.body;

      const updatedOrganization = await this.orgService.updateOrganization(
        orgId,
        updates
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Organization updated successfully",
        payload: updatedOrganization,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  private getAllOrganizations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const oragizations = await this.orgService.getAllOrganizations();
      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Organizations fetched successfully",
        payload: oragizations,
      });
    } catch (err) {
      next(new HttpException(500, "failed", err.message));
    }
  };
}

export default OrganizationController;
