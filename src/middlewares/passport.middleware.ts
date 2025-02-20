import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import userModel from '../resources/user/user.model';

passport.use(new LocalStrategy(
  async (username, password, done) => {
    console.log('using passport...')
    try {
      const user = await userModel.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      const isMatch = await user.isValidPassword(password); if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect credentials' });
      }
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  console.log('passport serializeUser...')
  console.log(user)
  done(null, user._id);
});

passport.deserializeUser(async (_id, done) => {
  console.log('passport deserializeUser...')

  try {
    const user = await userModel.findById(_id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

async function passportMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  console.log('passport passportMiddleware...')

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info?.message || 'Unauthorized' });
    }
  })(req, res, next);
}

export default passportMiddleware;
