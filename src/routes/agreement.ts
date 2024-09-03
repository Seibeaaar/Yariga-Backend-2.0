import {
  checkAgreementIdParam,
  checkIsAgreementCounterpart,
  validateAgreementEntities,
  validateAgreementRequestBody,
} from "@/middlewares/agreement";
import {
  checkIfTenant,
  fetchUserFromTokenData,
  verifyJWToken,
} from "@/middlewares/common";
import Agreement from "@/models/Agreement";
import Property from "@/models/Property";
import User from "@/models/User";
import { AGREEMENT_STATUS } from "@/types/agreement";
import { PROPERTY_STATUS } from "@/types/property";
import { generateErrorMesaage } from "@/utils/common";
import { Router } from "express";

const AgreementRouter = Router();

AgreementRouter.post(
  "/create",
  verifyJWToken,
  fetchUserFromTokenData,
  checkIfTenant,
  validateAgreementRequestBody,
  validateAgreementEntities,
  async (req, res) => {
    try {
      const { userId } = res.locals;
      const agreement = new Agreement({
        ...req.body,
        creator: userId,
      });
      await agreement.save();
      res.status(200).send(agreement);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

AgreementRouter.put(
  "/:id/accept",
  verifyJWToken,
  checkAgreementIdParam,
  checkIsAgreementCounterpart,
  async (req, res) => {
    try {
      const { agreement } = res.locals;
      const acceptedAgreement = await Agreement.findByIdAndUpdate(
        agreement.id,
        {
          status: AGREEMENT_STATUS.Accepted,
        },
        {
          new: true,
        },
      );

      await Property.findByIdAndUpdate(
        agreement.property,
        {
          status: PROPERTY_STATUS.Sold,
        },
        {
          new: true,
        },
      );

      await User.findByIdAndUpdate(
        agreement.landlord,
        {
          $push: {
            tenants: agreement.tenant,
          },
        },
        {
          new: true,
        },
      );

      res.status(200).send(acceptedAgreement);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

AgreementRouter.put(
  "/:id/decline",
  verifyJWToken,
  checkAgreementIdParam,
  checkIsAgreementCounterpart,
  async (req, res) => {
    try {
      const { agreement } = res.locals;
      const declinedAgreement = await Agreement.findByIdAndUpdate(
        agreement.id,
        {
          status: AGREEMENT_STATUS.Declined,
          isArchived: true,
        },
        {
          new: true,
        },
      );

      res.status(200).send(declinedAgreement);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

export default AgreementRouter;
