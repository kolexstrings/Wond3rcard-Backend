import { Request, Response, NextFunction } from "express";
import HttpException from "../../../exceptions/http.exception";
import TeamService from "./team.service";

class TeamController {
  private teamService: TeamService;

  constructor() {
    this.teamService = new TeamService();
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
