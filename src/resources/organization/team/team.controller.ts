import { Request, Response, NextFunction, Router } from "express";
import HttpException from "../../../exceptions/http.exception";
import TeamService from "./team.service";
import verifyTeamRolesMiddleware from "../../../middlewares/orgTeamRoles.middleware";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";
import validationMiddleware from "../../../middlewares/validation.middleware";
import { TeamRole } from "./team.protocol";
import validator from "./team.validation";

class TeamController {
  public path = "/organizations";
  public router = Router();
  private teamService = new TeamService();

  constructor() {
    this.teamService = new TeamService();
  }

  initializeRoute(): void {
    this.router.post(
      `${this.path}/create`,
      authenticatedMiddleware,
      validationMiddleware(validator.createTeamValidator),
      this.createNewTeam
    );

    // Add a member to a team
    this.router.post(
      `${this.path}/add-member`,
      authenticatedMiddleware,
      verifyTeamRolesMiddleware([TeamRole.Lead, TeamRole.Moderator]),
      validationMiddleware(validator.addTeamMemberValidator),
      this.addTeamMember
    );

    // Remove a member from a team
    this.router.delete(
      `${this.path}/remove-member`,
      authenticatedMiddleware,
      verifyTeamRolesMiddleware([TeamRole.Lead, TeamRole.Moderator]),
      validationMiddleware(validator.removeTeamMemberValidator),
      this.removeTeamMember
    );

    // Get members of a specific team
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

      const { name, description } = req.body;
      const creatorId = req.user.id;

      const team = await this.teamService.createTeam(
        creatorId,
        name,
        description
      );

      res.status(201).json({
        statusCode: 201,
        status: "success",
        message: "Team created successfully",
        payload: team,
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
      const { teamId, memberId, role } = req.body;
      const updatedTeam = await this.teamService.addMemberToTeam(
        teamId,
        memberId,
        role
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Member added to team successfully",
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
      const { teamId, memberId } = req.body;
      const updatedTeam = await this.teamService.removeMember(teamId, memberId);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Member removed from team successfully",
        payload: updatedTeam,
      });
    } catch (error) {
      next(new HttpException(500, "failed", error.message));
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
