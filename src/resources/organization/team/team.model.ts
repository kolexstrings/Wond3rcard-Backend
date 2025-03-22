import { Schema, model, Types } from "mongoose";
import { TeamRole, TeamMember, Team } from "./team.protocol";

const teamSchema = new Schema<Team>(
  {
    name: { type: String, required: true },
    description: { type: String },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    members: [
      {
        memberId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: Object.values(TeamRole), required: true },
      },
    ],
  },
  { timestamps: true }
);

export default model<Team>("Team", teamSchema);
export { Team, TeamRole };
