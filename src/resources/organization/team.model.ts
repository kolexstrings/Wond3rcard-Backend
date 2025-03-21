import { Schema, model, Types } from "mongoose";

enum TeamRole {
  None = "none",
  Member = "member",
  Lead = "lead",
  Moderator = "moderator",
}

interface TeamMember {
  userId: Types.ObjectId;
  role: TeamRole;
}

interface Team {
  _id: Types.ObjectId;
  name: string;
  organizationId: Types.ObjectId;
  members: TeamMember[];
}

const teamSchema = new Schema<Team>(
  {
    name: { type: String, required: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: Object.values(TeamRole), required: true },
      },
    ],
  },
  { timestamps: true }
);

export default model<Team>("Team", teamSchema);
export { Team, TeamRole };
