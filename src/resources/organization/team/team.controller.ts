import { Request, Response, NextFunction, Router } from "express";
import { Types } from "mongoose";
import HttpException from "../../../exceptions/http.exception";
import TeamService from "./team.service";
import verifyTeamRolesMiddleware from "../../../middlewares/orgTeamRoles.middleware";
import verifyOrgRolesMiddleware from "../../../middlewares/orgnizationRoles.middleware";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";
import validationMiddleware from "../../../middlewares/validation.middleware";
import { TeamRole } from "./team.protocol";
import validator from "./team.validation";

class TeamController {
  public path = "/organizations/:orgId/teams";
  public router = Router();
  private teamService = new TeamService();

  constructor() {
    this.teamService = new TeamService();
    this.initializeRoute();
  }

  initializeRoute(): void {
    /**
     * @openapi
     * /api/organizations/{orgId}/teams/:
     *   post:
     *     tags: [teams]
     *     summary: Create a new team in an organization
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orgId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateTeam'
     *     responses:
     *       201:
     *         description: Team created
     */
    this.router.post(
      `${this.path}/`,
      authenticatedMiddleware,
      validationMiddleware(validator.createTeamValidator),
      this.createNewTeam
    );

    /**
     * @openapi
     * /api/organizations/{orgId}/teams:
     *   get:
     *     tags: [teams]
     *     summary: Get all teams in an organization
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orgId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Teams retrieved
     */
    this.router.get(`${this.path}`, authenticatedMiddleware, this.getAllTeams);

    /**
     * @openapi
     * /api/organizations/{orgId}/teams/{teamId}:
     *   get:
     *     tags: [teams]
     *     summary: Get a specific team by ID
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orgId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: teamId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Team retrieved
     */
    this.router.get(
      `${this.path}/:teamId`,
      authenticatedMiddleware,
      this.getTeamById
    );

    /**
     * @openapi
     * /api/organizations/{orgId}/teams/{teamId}:
     *   put:
     *     tags: [teams]
     *     summary: Update a team (Team Lead only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orgId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: teamId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateTeam'
     *     responses:
     *       200:
     *         description: Team updated
     */
    this.router.put(
      `${this.path}/:teamId`,
      authenticatedMiddleware,
      verifyTeamRolesMiddleware([TeamRole.Lead]),
      validationMiddleware(validator.updateTeamValidator),
      this.updateTeam
    );

    /**
     * @openapi
     * /api/organizations/{orgId}/teams/{teamId}:
     *   delete:
     *     tags: [teams]
     *     summary: Delete a team (Team Lead only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orgId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: teamId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Team deleted
     */
    this.router.delete(
      `${this.path}/:teamId`,
      authenticatedMiddleware,
      verifyTeamRolesMiddleware([TeamRole.Lead]),
      this.deleteTeam
    );

    /**
     * @openapi
     * /api/organizations/{orgId}/teams/{teamId}/members:
     *   post:
     *     tags: [teams]
     *     summary: Add a member to a team (Lead/Moderator only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orgId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: teamId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AddTeamMember'
     *     responses:
     *       200:
     *         description: Member added
     */
    this.router.post(
      `${this.path}/:teamId/members`,
      authenticatedMiddleware,
      verifyTeamRolesMiddleware([TeamRole.Lead, TeamRole.Moderator]),
      validationMiddleware(validator.addTeamMemberValidator),
      this.addTeamMember
    );

    /**
     * @openapi
     * /api/organizations/{orgId}/teams/{teamId}/members:
     *   delete:
     *     tags: [teams]
     *     summary: Remove a member from a team (Lead/Moderator only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orgId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: teamId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [memberId]
     *             properties:
     *               memberId:
     *                 type: string
     *     responses:
     *       200:
     *         description: Member removed
     */
    this.router.delete(
      `${this.path}/:teamId/members`,
      authenticatedMiddleware,
      verifyTeamRolesMiddleware([TeamRole.Lead, TeamRole.Moderator]),
      validationMiddleware(validator.removeTeamMemberValidator),
      this.removeTeamMember
    );

    /**
     * @openapi
     * /api/organizations/{orgId}/teams/{teamId}/assign-role:
     *   put:
     *     tags: [teams]
     *     summary: Assign role to a team member (Lead only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orgId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: teamId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AssignRole'
     *     responses:
     *       200:
     *         description: Role assigned
     */
    this.router.put(
      `${this.path}/:teamId/assign-role`,
      authenticatedMiddleware,
      verifyTeamRolesMiddleware([TeamRole.Lead]),
      validationMiddleware(validator.assignRoleValidator),
      this.assignRoleToMember
    );

    /**
     * @openapi
     * /api/organizations/{orgId}/teams/{teamId}/members:
     *   get:
     *     tags: [teams]
     *     summary: Get members of a team
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orgId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: teamId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Members retrieved
     */
    this.router.get(
      `${this.path}/:teamId/members`,
      authenticatedMiddleware,
      this.getTeamMembers
    );
  }

  public createNewTeam = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        return next(
          new HttpException(401, "Unauthorized", "User not authenticated")
        );
      }

      const { orgId } = req.params;
      const { name, description, leadId } = req.body;

      const creatorId = req.user.id;

      console.log("Lead ID:", leadId, "| Type:", typeof leadId);
      console.log("Org ID:", orgId, "| Type:", typeof orgId);
      console.log("Creator ID:", creatorId, "| Type:", typeof creatorId);

      if (!orgId) {
        return next(
          new HttpException(
            400,
            "Bad Request",
            "Organization ID is required in the request path."
          )
        );
      }

      if (!Types.ObjectId.isValid(orgId)) {
        return next(
          new HttpException(
            400,
            "Bad Request",
            "Invalid Organization ID format."
          )
        );
      }

      if (!leadId) {
        return next(
          new HttpException(400, "Bad Request", "Team Lead must be specified.")
        );
      }

      if (!Types.ObjectId.isValid(leadId)) {
        return next(
          new HttpException(400, "Bad Request", "Invalid Lead ID format.")
        );
      }

      console.log("Validated Input - Org ID:", orgId, "Lead ID:", leadId);

      const team = await this.teamService.createTeam(
        orgId,
        creatorId,
        leadId,
        name,
        description
      );

      res.status(201).json({
        statusCode: 201,
        status: "success",
        message: "Team created successfully.",
        payload: team,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  public getAllTeams = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orgId } = req.params;
      const teams = await this.teamService.getAllTeams(orgId);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Teams retrieved successfully",
        payload: teams,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  public getTeamById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orgId, teamId } = req.params;
      const team = await this.teamService.getTeamById(orgId, teamId);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Team retrieved successfully",
        payload: team,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  public updateTeam = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orgId, teamId } = req.params;
      const updatedTeam = await this.teamService.updateTeam(
        orgId,
        teamId,
        req.body
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Team updated successfully",
        payload: updatedTeam,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  public deleteTeam = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orgId, teamId } = req.params;
      await this.teamService.deleteTeam(orgId, teamId);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Team deleted successfully",
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  public addTeamMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orgId, teamId } = req.params;
      const { memberId, role } = req.body;
      const updatedTeam = await this.teamService.addMemberToTeam(
        orgId,
        teamId,
        memberId,
        role
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Member added successfully",
        payload: updatedTeam,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  public removeTeamMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orgId, teamId } = req.params;
      const { memberId } = req.body;
      const updatedTeam = await this.teamService.removeMember(
        orgId,
        teamId,
        memberId
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Member removed successfully",
        payload: updatedTeam,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };

  public assignRoleToMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { teamId } = req.params;
      const { memberId, role } = req.body;
      const userId = req.user?.id;

      // Validate request body
      const { error } = validator.assignRoleValidator.validate({
        memberId,
        role,
      });
      if (error) {
        return next(
          new HttpException(400, "Validation Error", error.details[0].message)
        );
      }

      // Assign role
      const updatedTeam = await this.teamService.assignRole(
        teamId,
        userId,
        memberId,
        role
      );

      res.status(200).json({
        status: "success",
        message: "Role assigned successfully",
        payload: updatedTeam,
      });
    } catch (error) {
      next(new HttpException(500, "Failed", error.message));
    }
  };

  public getTeamMembers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { teamId } = req.params;
      const members = await this.teamService.getMembers(teamId);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Team members retrieved successfully",
        payload: members,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
    }
  };
}

export default TeamController;
