import { Document } from 'mongoose';

interface FAQ extends Document {
  question: string;
  answer: string;
  category?: 'General' | 'Technical' | 'Billing' | 'Account';
}

export { FAQ };
