import { model, Schema } from "mongoose";
import { Organization, OrgRole } from "./organization.protocol";

const organizationSchema = new Schema<Organization>(
  {
    creatorId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true },
    businessType: { type: String, required: true },
    industry: { type: String, required: true },
    companyWebsite: { type: String, required: false },
    members: [
      {
        memberId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        organizationId: {
          type: Schema.Types.ObjectId,
          ref: "Organization",
          required: true,
        },
        role: { type: String, enum: Object.values(OrgRole), required: true },
      },
    ],
    teams: [{ type: Schema.Types.ObjectId, ref: "Team" }],
  },
  {
    timestamps: true,
  }
);

export default model<Organization>("Organization", organizationSchema);
