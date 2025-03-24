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
import { Types } from "mongoose";
import verifyOrgRolesMiddleware from "../../middlewares/orgnizationRoles.middleware";
import { OrgRole } from "./organization.protocol";
import teamModel from "./team/team.model";

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
      `${this.path}/:orgId/add-member`,
      authenticatedMiddleware,
      verifyOrgRolesMiddleware([OrgRole.Admin, OrgRole.Lead]),
      validationMiddleware(validator.addMemberValidator),
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
        verifyOrgRolesMiddleware([OrgRole.Admin]),
      ],
      this.changeMemberRole
    );

    this.router.delete(
      `${this.path}/:orgId/remove-member`,
      [
        authenticatedMiddleware,
        validationMiddleware(validator.removeMemberValidator),
        verifyOrgRolesMiddleware([OrgRole.Admin, OrgRole.Lead]),
      ],
      this.removeMember
    );

    this.router.delete(
      `${this.path}/:orgId/delete`,
      [authenticatedMiddleware],
      verifyRolesMiddleware([UserRole.Admin]),
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

    this.router.get(
      `${this.path}/:orgId`,
      [authenticatedMiddleware],
      this.getOrganizationById
    );

    this.router.get(
      `${this.path}/:orgId/teams`,
      [authenticatedMiddleware],
      this.getOrganizationTeams
    );
  }

  private createNewOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name, businessType, industry, companyWebsite, memberId } =
        req.body;
      const creatorId = req.user.id;

      if (memberId && memberId !== creatorId) {
        throw new HttpException(
          400,
          "failed",
          "Provided memberId does not match the authenticated user."
        );
      }

      // Call createOrganization without passing extra members.
      const org = await this.orgService.createOrganization(
        creatorId,
        name,
        businessType,
        industry,
        companyWebsite
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
  ): Promise<void> => {
    try {
      const organizationId = req.params.orgId;
      const { memberId, role } = req.body;

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

      const orgObjectId = new Types.ObjectId(organizationId);

      if (
        !user.organizations.some(
          (org) => org.memberId.toString() === orgObjectId.toString()
        )
      ) {
        user.organizations.push({ memberId: orgObjectId, role });
        await user.save();
      }

      res.status(200).json({
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
  ): Promise<void> => {
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
  ): Promise<void> => {
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
  ): Promise<void> => {
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
  ): Promise<void> => {
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
  ): Promise<void> => {
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
  ): Promise<void> => {
    try {
      const { orgId } = req.params;
      const updates = req.body;

      // Validate orgId
      if (!Types.ObjectId.isValid(orgId)) {
        throw new HttpException(400, "invalid_id", "Invalid organization ID");
      }

      // Validate and convert ObjectId fields in the request body
      if (updates.creatorId && !Types.ObjectId.isValid(updates.creatorId)) {
        throw new HttpException(400, "invalid_id", "Invalid creator ID");
      }

      if (updates.members) {
        updates.members = updates.members.map((member: any) => {
          if (!Types.ObjectId.isValid(member.memberId)) {
            throw new HttpException(400, "invalid_id", "Invalid member ID");
          }
          return {
            memberId: new Types.ObjectId(member.memberId),
            organizationId: new Types.ObjectId(orgId),
            role: member.role,
          };
        });
      }

      // Call service function
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
  ): Promise<void> => {
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

  private getOrganizationById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orgId } = req.params;
      const organization = await this.orgService.getOrganizationById(orgId);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Organization retrieved successfully",
        payload: organization,
      });
    } catch (error) {
      next(new HttpException(error.statusCode || 500, "failed", error.message));
    }
  };

  public async getOrganizationTeams(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { orgId } = req.params;

      // Ensure orgId is a valid ObjectId
      if (!Types.ObjectId.isValid(orgId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      // Fetch all teams associated with the organization
      const teams = await teamModel.find({ organizationId: orgId });

      return res.status(200).json({ success: true, teams });
    } catch (error) {
      next(error);
    }
  }
}

export default OrganizationController;
