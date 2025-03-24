import mongoose, { Types } from "mongoose";
import HttpException from "../../../exceptions/http.exception";
import logger from "../../../services/logger/logger";
import teamModel from "./team.model";
import userModel from "../../user/user.model";
import { Team, TeamMember, TeamRole } from "./team.protocol";
import organizationModel from "../organization.model";

class TeamService {
  private team = teamModel;
  private organization = organizationModel;

  public async createTeam(
    orgId: string,
    creatorId: string,
    leadId: string,
    name: string,
    description?: string
  ): Promise<Team> {
    try {
      const creatorObjectId = new Types.ObjectId(creatorId);
      const leadObjectId = new Types.ObjectId(leadId);
      const orgObjectId = new Types.ObjectId(orgId);

      // Ensure the creator and lead are different people
      if (creatorId === leadId) {
        throw new HttpException(
          400,
          "error",
          "Creator cannot be the only Team Lead."
        );
      }

      // Define members (Creator & Lead)
      const members: TeamMember[] = [
        {
          memberId: creatorObjectId,
          role: TeamRole.Lead,
        },
        {
          memberId: leadObjectId,
          role: TeamRole.Lead,
        },
      ];

      // Create the team
      const team = await this.team.create({
        organizationId: orgObjectId,
        creatorId: creatorObjectId,
        name,
        description,
        members,
      });

      // Assign the correct teamId to members
      team.members = team.members.map((member) => ({
        ...member,
        teamId: team._id,
      }));

      await team.save();

      await this.organization.findByIdAndUpdate(orgId, {
        $push: { teams: team._id },
      });

      return team.toObject();
    } catch (error) {
      throw new HttpException(
        500,
        "failed",
        `Unable to create team: ${error.message}`
      );
    }
  }

  public async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const teams = await this.team.find({
        $or: [{ creatorId: userId }, { "members.memberId": userId }],
      });

      return teams.map((team) => team.toObject());
    } catch (error) {
      logger.error(`Failed to retrieve teams for user: ${userId}`);
      throw new HttpException(500, "failed", "Unable to retrieve teams");
    }
  }

  public async addMemberToTeam(
    orgId: string,
    teamId: string,
    memberId: string,
    role: TeamRole
  ): Promise<Team> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(orgId) ||
        !mongoose.Types.ObjectId.isValid(teamId) ||
        !mongoose.Types.ObjectId.isValid(memberId)
      ) {
        throw new HttpException(400, "Bad Request", "Invalid ID format");
      }

      // Find the team within the given organization
      const team = await this.team.findOne({
        _id: teamId,
        organizationId: orgId,
      });
      if (!team) {
        throw new HttpException(
          404,
          "Not Found",
          "Team not found in the organization"
        );
      }

      // Check if the member already exists in the team
      if (
        team.members.some((member) => member.memberId.toString() === memberId)
      ) {
        throw new HttpException(
          409,
          "Conflict",
          "Member already exists in the team"
        );
      }

      // Add new member to the team
      team.members.push({
        memberId: new Types.ObjectId(memberId),
        role,
      });

      await team.save();

      return team.toObject();
    } catch (error) {
      throw new HttpException(
        500,
        "Failed",
        `Error adding member: ${error.message}`
      );
    }
  }

  public async removeMember(
    orgId: string,
    teamId: string,
    memberId: string
  ): Promise<Team> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(orgId) ||
        !mongoose.Types.ObjectId.isValid(teamId) ||
        !mongoose.Types.ObjectId.isValid(memberId)
      ) {
        throw new HttpException(400, "Bad Request", "Invalid ID format");
      }

      // Find the team within the specified organization
      const team = await this.team.findOne({
        _id: teamId,
        organizationId: orgId,
      });
      if (!team) {
        throw new HttpException(
          404,
          "Not Found",
          "Team not found in the organization"
        );
      }

      const initialMemberCount = team.members.length;
      team.members = team.members.filter(
        (m) => m.memberId.toString() !== memberId
      );

      if (team.members.length === initialMemberCount) {
        throw new HttpException(
          404,
          "Not Found",
          "Member not found in the team"
        );
      }

      await team.save();
      return team.toObject();
    } catch (error) {
      throw new HttpException(
        500,
        "Failed",
        `Error removing member: ${error.message}`
      );
    }
  }

  public async assignRole(
    teamId: string,
    userId: string,
    memberId: string,
    role: string
  ) {
    const teamObjectId = new Types.ObjectId(teamId);
    const memberObjectId = new Types.ObjectId(memberId);
    const userObjectId = new Types.ObjectId(userId);

    // Fetch team
    const team = await teamModel.findById(teamObjectId);
    if (!team) {
      throw new HttpException(
        404,
        "Team Not Found",
        "The specified team does not exist."
      );
    }

    // Check if requester is a team lead
    const requestingUser = team.members.find((m) =>
      m.memberId.equals(userObjectId)
    );
    if (!requestingUser || requestingUser.role !== TeamRole.Lead) {
      throw new HttpException(
        403,
        "Forbidden",
        "Only Team Leads can assign roles."
      );
    }

    // Check if the member exists in the team
    const member = team.members.find((m) => m.memberId.equals(memberObjectId));
    if (!member) {
      throw new HttpException(
        404,
        "Member Not Found",
        "The specified member is not in this team."
      );
    }

    // Ensure the role is valid and assign it
    if (!Object.values(TeamRole).includes(role as TeamRole)) {
      throw new HttpException(400, "Invalid Role", "Role is not valid.");
    }

    member.role = role as TeamRole;

    team.markModified("members");

    await team.save();

    return team.toObject();
  }

  public async deleteTeam(orgId: string, teamId: string): Promise<void> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(orgId) ||
        !mongoose.Types.ObjectId.isValid(teamId)
      ) {
        throw new HttpException(400, "Bad Request", "Invalid ID format");
      }

      // Find the team within the specified organization
      const team = await this.team.findOne({
        _id: teamId,
        organizationId: orgId,
      });
      if (!team) {
        throw new HttpException(
          404,
          "Not Found",
          "Team not found in the organization"
        );
      }

      await this.team.deleteOne({ _id: teamId, organizationId: orgId });
    } catch (error) {
      throw new HttpException(
        500,
        "Failed",
        `Error deleting team: ${error.message}`
      );
    }
  }

  public async updateTeam(
    orgId: string,
    teamId: string,
    updates: Partial<Team>
  ): Promise<Team> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(orgId) ||
        !mongoose.Types.ObjectId.isValid(teamId)
      ) {
        throw new HttpException(400, "Bad Request", "Invalid ID format");
      }

      // Find the team within the specified organization
      const team = await this.team.findOne({
        _id: teamId,
        organizationId: orgId,
      });
      if (!team) {
        throw new HttpException(
          404,
          "Not Found",
          "Team not found in the organization"
        );
      }

      // Define allowed fields that can be updated
      const allowedUpdates = ["name", "description", "members"];
      Object.keys(updates).forEach((key) => {
        if (!allowedUpdates.includes(key)) {
          delete (updates as any)[key];
        }
      });

      // Apply updates
      Object.assign(team, updates);
      await team.save();

      return team.toObject();
    } catch (error) {
      throw new HttpException(
        500,
        "Failed",
        `Error updating team: ${error.message}`
      );
    }
  }

  public async getAllTeams(orgId: string): Promise<Team[]> {
    try {
      return await this.team.find({ orgId }).populate("members");
    } catch (error) {
      throw new HttpException(
        500,
        "Failed",
        `Error retrieving teams: ${error.message}`
      );
    }
  }

  public async getTeamById(
    orgId: string,
    teamId: string
  ): Promise<Team | null> {
    try {
      return await this.team
        .findOne({ _id: teamId, organizationId: orgId })
        .populate("members");
    } catch (error) {
      throw new HttpException(
        500,
        "Failed",
        `Error retrieving team: ${error.message}`
      );
    }
  }

  public async getMembers(teamId: string): Promise<Team | null> {
    try {
      return await this.team.findOne({ _id: teamId }).populate("members");
    } catch (error) {
      throw new HttpException(
        500,
        "Failed",
        `Error retrieving team members: ${error.message}`
      );
    }
  }
}

export default TeamService;
