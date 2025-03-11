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
import { upload, uploadPhotosToAWS } from "@/utils/media";
import { USER_ONBOARDING_STEP, USER_ROLE } from "@/types/user";
import { getLandlordStats, getTenantStats } from "@/utils/user";

const UserRouter = Router();

UserRouter.post(
  "/complete",
  verifyJWToken,
  validateUserCompleteRequest,
  async (req, res) => {
    try {
      const { userId } = res.locals;
      const nextOnboardingStep =
        req.body.role === USER_ROLE.Landlord
          ? USER_ONBOARDING_STEP.AddProperty
          : USER_ONBOARDING_STEP.SetPreferences;

      const completedUser = await User.findByIdAndUpdate(
        userId,
        {
          ...req.body,
          onboardingStep: nextOnboardingStep,
        },
        {
          new: true,
        },
      );

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
      const [photoUrl] = await uploadPhotosToAWS([req.file]);

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
          preferences: req.body.preferences,
          ...(req.body.initial && { onboardingStep: null }),
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

UserRouter.get(
  "/stats",
  verifyJWToken,
  fetchUserFromTokenData,
  async (req, res) => {
    try {
      const { user } = res.locals;
      const stats =
        user.role === USER_ROLE.Landlord
          ? await getLandlordStats(user)
          : await getTenantStats(user);

      res.status(200).send(stats);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

export default UserRouter;
