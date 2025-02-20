import passport from 'passport';
import { Strategy as LocalStrategy } from "passport-local";
import userModel from '../resources/user/user.model';

passport.use(new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
  },
  async (email, password, done) => {
    try {
      const user = await userModel.findOne({ email });
      if (!user) return done(null, false, { message: "User not found" });

      const isMatch = await user.isValidPassword(password);
      if (isMatch) return done(null, user);
      else return done(null, false, { message: "Incorrect credentials" });

    } catch (error) {
      return done(error);
    }
  }
));
