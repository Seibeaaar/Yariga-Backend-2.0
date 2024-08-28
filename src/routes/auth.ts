import { Router } from "express";
import bcrypt from "bcrypt";
import { generateErrorMesaage, omitPasswordForUser } from "@/utils/common";
import {
  checkEmailAlreadyInUse,
  validateSignUpRequest,
} from "@/middlewares/auth";
import User from "@/models/User";
import { signJWT } from "@/utils/common";
import { AUTH_PROVIDER } from "@/types/user";
import { PASSWORD_HASHING_ROUNDS } from "@/constants/auth";

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

export default AuthRouter;
