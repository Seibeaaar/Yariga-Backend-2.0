import {
  validateAgreementEntities,
  validateAgreementRequestBody,
} from "@/middlewares/agreement";
import {
  checkIfTenant,
  fetchUserFromTokenData,
  verifyJWToken,
} from "@/middlewares/common";
import Agreement from "@/models/Agreement";
import User from "@/models/User";
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
      const agreement = new Agreement(req.body);
      await agreement.save();

      await User.findByIdAndUpdate(req.body.landlord, {
        $addToSet: {
          tenants: req.body.tenant,
        },
      });
      res.status(200).send(agreement);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

export default AgreementRouter;
