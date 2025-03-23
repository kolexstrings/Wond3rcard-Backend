import mongoose from "mongoose";
import HttpException from "../../exceptions/http.exception";
import logger from "../../services/logger/logger";
import userModel from "../user/user.model";
import organizationModel from "./organization.model";
import {
  Organization,
  OrganizationMember,
  OrgRole,
} from "./organization.protocol";
import { Types } from "mongoose";
import teamModel from "./team/team.model";

class OrganizationService {
  private org = organizationModel;

  public async createOrganization(
    creatorId: string,
    name: string,
    businessType: string,
    industry: string,
    companyWebsite?: string
  ): Promise<Organization> {
    try {
      const creatorObjectId = new Types.ObjectId(creatorId);

      // Default member as the creator with a fixed role "Lead"
      const defaultMember: OrganizationMember = {
        memberId: creatorObjectId,
        role: OrgRole.Lead,
      };

      // Create organization with only the default member
      const organization = await this.org.create({
        creatorId: creatorObjectId,
        name,
        businessType,
        industry,
        companyWebsite,
        members: [defaultMember],
      });

      // Update each member with the correct organizationId
      organization.members = organization.members.map((member) => ({
        ...member,
        organizationId: organization.id,
      }));

      await organization.save();

      // Link the organization to the creator's user profile
      const creator = await userModel.findById(creatorId);
      if (!creator) {
        throw new HttpException(
          404,
          "User Not Found",
          "The creator does not exist"
        );
      }

      if (!creator.organizations.includes(organization.id)) {
        creator.organizations.push(organization.id);
        await creator.save();
      }

      return organization;
    } catch (error) {
      throw new HttpException(
        500,
        "failed",
        `Unable to create organization: ${error.message}`
      );
    }
  }

  public async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      const organizations = await this.org.find({
        $or: [{ creatorId: userId }, { "members.memberId": userId }],
      });

      return organizations;
    } catch (error) {
      logger.error(`Failed to retrieve organizations for user: ${userId}`);
      throw new HttpException(
        500,
        "failed",
        "Unable to retrieve organizations"
      );
    }
  }

  public async addMemberToOrganization(
    orgId: string,
    memberId: string,
    role: OrgRole
  ): Promise<Organization> {
    try {
      if (!mongoose.Types.ObjectId.isValid(orgId)) {
        throw new HttpException(
          400,
          "Bad Request",
          "Invalid organization ID format"
        );
      }

      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        throw new HttpException(400, "Bad Request", "Invalid member ID format");
      }

      const orgObjectId = new mongoose.Types.ObjectId(orgId);
      const memberObjectId = new mongoose.Types.ObjectId(memberId);

      const organization = await this.org.findById(orgObjectId);

      if (!organization) {
        throw new HttpException(404, "Not Found", "Organization not found");
      }

      // Convert ObjectId to string for comparison
      const isAlreadyMember = organization.members.some(
        (member) => member.memberId.toString() === memberObjectId.toString()
      );

      if (isAlreadyMember) {
        throw new HttpException(
          409,
          "Conflict",
          "Member already exists in the organization"
        );
      }

      const newMember: OrganizationMember = {
        memberId: memberObjectId,
        role,
      };

      organization.members.push(newMember);
      await organization.save();

      return organization;
    } catch (error) {
      throw new HttpException(
        500,
        "Failed",
        `Error adding member: ${error.message}`
      );
    }
  }

  public async getMembersOfOrganization(
    orgId: string
  ): Promise<OrganizationMember[]> {
    try {
      const organization = await this.org.findById(orgId);

      if (!organization) {
        throw new HttpException(404, "not_found", "Organization not found");
      }

      return organization.members || [];
    } catch (error) {
      throw new HttpException(
        500,
        "failed",
        `Error retrieving members: ${error.message}`
      );
    }
  }

  public async changeMemberRole(
    orgId: string,
    memberId: string,
    newRole: OrgRole
  ): Promise<Organization> {
    try {
      if (!mongoose.Types.ObjectId.isValid(orgId)) {
        throw new HttpException(
          400,
          "Bad Request",
          "Invalid organization ID format"
        );
      }

      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        throw new HttpException(400, "Bad Request", "Invalid member ID format");
      }

      const orgObjectId = new mongoose.Types.ObjectId(orgId);
      const memberObjectId = new mongoose.Types.ObjectId(memberId);

      const organization = await this.org.findById(orgObjectId);

      if (!organization) {
        throw new HttpException(404, "not_found", "Organization not found");
      }

      // Convert ObjectId to string for comparison
      const member = organization.members?.find(
        (m) => m.memberId.toString() === memberObjectId.toString()
      );

      if (!member) {
        throw new HttpException(
          404,
          "not_found",
          "Member not found in the organization"
        );
      }

      member.role = newRole;
      await organization.save();

      return organization;
    } catch (error) {
      throw new HttpException(
        500,
        "failed",
        `Error changing member role: ${error.message}`
      );
    }
  }

  public async removeMember(
    orgId: string,
    memberId: string
  ): Promise<Organization> {
    try {
      if (!mongoose.Types.ObjectId.isValid(orgId)) {
        throw new HttpException(
          400,
          "Bad Request",
          "Invalid organization ID format"
        );
      }

      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        throw new HttpException(400, "Bad Request", "Invalid member ID format");
      }

      const orgObjectId = new mongoose.Types.ObjectId(orgId);
      const memberObjectId = new mongoose.Types.ObjectId(memberId);

      const organization = await this.org.findById(orgObjectId);

      if (!organization) {
        throw new HttpException(404, "not_found", "Organization not found");
      }

      const initialMemberCount = organization.members?.length || 0;

      // Convert ObjectId to string for proper comparison
      organization.members = organization.members?.filter(
        (m) => m.memberId.toString() !== memberObjectId.toString()
      );

      if (organization.members?.length === initialMemberCount) {
        throw new HttpException(
          404,
          "not_found",
          "Member not found in the organization"
        );
      }

      await organization.save();

      return organization;
    } catch (error) {
      throw new HttpException(
        500,
        "failed",
        `Error removing member: ${error.message}`
      );
    }
  }

  public async deleteOrganization(orgId: string): Promise<void> {
    try {
      const organization = await this.org.findById(orgId);

      if (!organization) {
        throw new HttpException(404, "not_found", "Organization not found");
      }

      await this.org.findByIdAndDelete(orgId);
    } catch (error) {
      throw new HttpException(
        500,
        "failed",
        `Error deleting organization: ${error.message}`
      );
    }
  }

  public async updateOrganization(
    orgId: string,
    updates: Partial<Organization>
  ): Promise<Organization> {
    try {
      // Convert orgId to ObjectId
      const orgObjectId = new Types.ObjectId(orgId);

      const organization = await this.org.findById(orgObjectId);

      if (!organization) {
        throw new HttpException(404, "not_found", "Organization not found");
      }

      if (updates.creatorId) {
        updates.creatorId = new Types.ObjectId(updates.creatorId) as any;
      }
      if (updates.members) {
        updates.members = updates.members.map((member) => ({
          memberId: new Types.ObjectId(member.memberId),
          organizationId: orgObjectId,
          role: member.role,
        }));
      }

      const allowedUpdates = [
        "name",
        "businessType",
        "industry",
        "companyWebsite",
        "members",
      ];

      Object.keys(updates).forEach((key) => {
        if (!allowedUpdates.includes(key)) {
          delete (updates as any)[key];
        }
      });

      Object.assign(organization, updates);
      await organization.save();

      return organization;
    } catch (error) {
      throw new HttpException(
        500,
        "failed",
        `Error updating organization: ${error.message}`
      );
    }
  }

  public async getAllOrganizations() {
    try {
      const organizations = await this.org.find();
      return organizations;
    } catch (error) {
      throw new HttpException(
        500,
        "failed",
        `Error retrieving organizations: ${error.message}`
      );
    }
  }

  public async getOrganizationTeams(orgId: string) {
    if (!Types.ObjectId.isValid(orgId)) {
      throw new Error("Invalid organization ID");
    }

    const teams = await teamModel.find({ organizationId: orgId });

    return teams;
  }
}

export default OrganizationService;
