import { UserDocument } from "@/types/user";
import passport, { Profile } from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:5001/auth/google/callback",
      passReqToCallback: true,
    },
    async function (_request, _accessToken, _refreshToken, profile, done) {
      return done(null, profile);
    },
  ),
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user as Profile);
});

export const buildGoogleRedirectURL = (
  token: string,
  user: UserDocument,
): string => {
  return `http://localhost:5173/auth/success?token=${token}&user=${encodeURIComponent(
    JSON.stringify(user),
  )}`;
};
