import { Router } from "express";
import bcrypt from "bcrypt";
import passport from "passport";
import { Profile } from "passport-google-oauth20";
import { generateErrorMesaage, omitPasswordForUser } from "@/utils/common";
import {
  checkEmailAlreadyInUse,
  validateSignUpRequest,
  validateLoginCredentials,
  validateLoginRequest,
} from "@/middlewares/auth";
import User from "@/models/User";
import { signJWT } from "@/utils/common";
import { AUTH_PROVIDER } from "@/types/user";
import { PASSWORD_HASHING_ROUNDS } from "@/constants/auth";
import "@/utils/auth";
import { buildGoogleRedirectURL } from "@/utils/auth";

const AuthRouter = Router();

AuthRouter.post(
  "/signUp",
  validateSignUpRequest,
  checkEmailAlreadyInUse,
  async (req, res) => {
    try {
      const passwordHash = bcrypt.hashSync(
        req.body.password,
        PASSWORD_HASHING_ROUNDS,
      );
      const user = new User({
        ...req.body,
        password: passwordHash,
        provider: AUTH_PROVIDER.Password,
      });
      await user.save();

      const token = signJWT(user.id);
      res.status(201).send({
        user: omitPasswordForUser(user),
        token,
      });
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

AuthRouter.post(
  "/login",
  validateLoginRequest,
  validateLoginCredentials,
  async (req, res) => {
    try {
      const { user } = res.locals;
      const token = signJWT(user.id);

      res.status(201).send({
        user: omitPasswordForUser(user),
        token,
      });
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

AuthRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  }),
);

AuthRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    accessType: "offline",
    scope: ["email", "profile"],
  }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(400).json({ error: "Authentication failed" });
      }

      const googleProfile = req.user as Profile;
      const primaryEmail = googleProfile.emails![0].value;

      const existingUser = await User.findOne({
        email: primaryEmail,
        provider: AUTH_PROVIDER.Google,
      });

      if (!existingUser) {
        const user = new User({
          firstName: googleProfile.name?.givenName,
          lastName: googleProfile.name?.familyName,
          email: primaryEmail,
          provider: AUTH_PROVIDER.Google,
          profilePicture: googleProfile.photos
            ? googleProfile.photos[0].value
            : null,
        });

        await user.save();
        const token = signJWT(user.id);

        return res.redirect(buildGoogleRedirectURL(token, user));
      }

      const token = signJWT(existingUser.id);
      return res.redirect(buildGoogleRedirectURL(token, existingUser));
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

export default AuthRouter;
