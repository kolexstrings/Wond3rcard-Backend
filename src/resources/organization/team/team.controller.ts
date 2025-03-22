import { Request, Response, NextFunction, Router } from "express";
import HttpException from "../../../exceptions/http.exception";
import TeamService from "./team.service";
import verifyTeamRolesMiddleware from "../../../middlewares/orgTeamRoles.middleware";
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
    this.router.post(
      `${this.path}`,
      authenticatedMiddleware,
      validationMiddleware(validator.createTeamValidator),
      this.createNewTeam
    );

    this.router.get(`${this.path}`, authenticatedMiddleware, this.getAllTeams);

    this.router.get(
      `${this.path}/:teamId`,
      authenticatedMiddleware,
      this.getTeamById
    );

    this.router.put(
      `${this.path}/:teamId`,
      authenticatedMiddleware,
      verifyTeamRolesMiddleware([TeamRole.Lead]),
      validationMiddleware(validator.updateTeamValidator),
      this.updateTeam
    );

    this.router.delete(
      `${this.path}/:teamId`,
      authenticatedMiddleware,
      verifyTeamRolesMiddleware([TeamRole.Lead]),
      this.deleteTeam
    );

    this.router.post(
      `${this.path}/:teamId/members`,
      authenticatedMiddleware,
      verifyTeamRolesMiddleware([TeamRole.Lead, TeamRole.Moderator]),
      validationMiddleware(validator.addTeamMemberValidator),
      this.addTeamMember
    );

    this.router.delete(
      `${this.path}/:teamId/members`,
      authenticatedMiddleware,
      verifyTeamRolesMiddleware([TeamRole.Lead, TeamRole.Moderator]),
      validationMiddleware(validator.removeTeamMemberValidator),
      this.removeTeamMember
    );

    this.router.put(
      `${this.path}/:teamId/assign-role`,
      authenticatedMiddleware,
      verifyTeamRolesMiddleware([TeamRole.Lead]),
      validationMiddleware(validator.assignRoleValidator),
      this.assignRoleToMember
    );

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

      if (!leadId) {
        return next(
          new HttpException(400, "error", "Team Lead must be specified.")
        );
      }

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
        teamId,
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
