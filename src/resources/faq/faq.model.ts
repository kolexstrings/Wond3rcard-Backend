import { Schema } from 'mongoose';

import { model } from "mongoose";
import { FAQ } from './faq.protocol';

const faqSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: {
    type: String,
    enum: ['General', 'Technical', 'Billing', 'Account'],
    default: 'General',
  },
},
  {
    timestamps: true
  },
)


export default model<FAQ>('faq', faqSchema)