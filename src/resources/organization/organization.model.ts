import { model, Schema } from "mongoose";
import { Organization } from "./organization.protocol";

const organizationSchema = new Schema({
  creatorId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: true },
  members: { type: [], require: false, unique: false },
},
  {
    timestamps: true
  },
)


export default model<Organization>('Organization', organizationSchema)