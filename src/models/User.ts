import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  // otp?: any;
  // otpExpires?: any;
  googleAuthSecret: string;
  username: string;
  email: string;
  countryCode?: string;
  phoneNumber: string;
  password: string;
  isVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  role: 'user' | 'seller';
  dob: Date;
  address: {
    houseNumber: string;
    locality:string;
    nearBy:string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  name: string;
  is2FAEnabled: boolean; 
  isActive: boolean; // New field
  isEmailVerified: boolean; // New field
  isPhoneVerified: boolean;
  isBlocked: boolean; // New 
  loginHistory: Date[]; // Array to store login timestamps
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, unique: true }, // Ensure this index is necessary
  countryCode: { type: String },
  phoneNumber: { type: String, unique: true }, // Ensure this index is necessary
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ['user', 'seller'],
    required: true,
    default: 'user',
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  googleAuthSecret: { type: String },
  dob: { type: Date, required: true },
  address: {
    houseNumber: { type: String, required: true },
    locality: { type: String, required: true },
    nearBy: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  name: { type: String, required: true },
  is2FAEnabled: { type: Boolean, default: false }, // Default to false
  isActive: { type: Boolean, default: false }, // Default to true
  isEmailVerified: { type: Boolean, default: false }, // Default to false
  isPhoneVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false }, // Default to true
  loginHistory: [{ type: Date }], // Define `loginHistory` as an array of dates
});

export default model<IUser>('Auth-ms', userSchema);
