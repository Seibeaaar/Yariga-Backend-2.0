import { Router } from "express";
import User from "@/models/User";
import {
  validatePropertyPreferences,
  validateUserCompleteRequest,
} from "@/middlewares/user";
import {
  checkIfTenant,
  fetchUserFromTokenData,
  verifyJWToken,
} from "@/middlewares/common";
import { generateErrorMesaage, omitPasswordForUser } from "@/utils/common";
import { upload, uploadPhotoToAWS } from "@/utils/media";

const UserRouter = Router();

UserRouter.post(
  "/complete",
  verifyJWToken,
  validateUserCompleteRequest,
  async (req, res) => {
    try {
      const { userId } = res.locals;

      const completedUser = await User.findByIdAndUpdate(userId, req.body, {
        new: true,
      });

      res.status(200).send(omitPasswordForUser(completedUser!));
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

UserRouter.post(
  "/picture",
  verifyJWToken,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("Profile picture required");
      }
      const photoUrl = await uploadPhotoToAWS(req.file);

      const { userId } = res.locals;
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          profilePicture: photoUrl,
        },
        {
          new: true,
        },
      );

      res.status(200).send(omitPasswordForUser(updatedUser!));
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

UserRouter.post(
  "/preferences",
  verifyJWToken,
  fetchUserFromTokenData,
  checkIfTenant,
  validatePropertyPreferences,
  async (req, res) => {
    try {
      const { userId } = res.locals;
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          preferences: req.body,
        },
        {
          new: true,
        },
      );

      res.status(200).send(omitPasswordForUser(updatedUser!));
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

export default UserRouter;
