import {
  checkAgreementIdParam,
  checkIsAgreementCounterpart,
  validateAgreementEntities,
  validateAgreementFilters,
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
import { USER_ROLE } from "@/types/user";
import { generateErrorMesaage, processPageQueryParam } from "@/utils/common";
import { PAGINATION_LIMIT } from "@/constants/common";
import { getAgreementUniqueNumber } from "@/utils/agreement";
import { Router } from "express";

const AgreementRouter = Router();

AgreementRouter.get(
  "/",
  verifyJWToken,
  fetchUserFromTokenData,
  validateAgreementFilters,
  async (req, res) => {
    try {
      const { user } = res.locals;
      const pageNumber = processPageQueryParam(
        req.query.page as string | undefined,
      );

      const startIndex = (pageNumber - 1) * PAGINATION_LIMIT;

      const query = Agreement.find({
        [user.role === USER_ROLE.Landlord ? "landlord" : "tenant"]: user.id,
        isArchived: false,
        status: {
          $in: req.body.status,
        },
        type: {
          $in: req.body.type,
        },
      });

      const myAgreements = await query.skip(startIndex).limit(PAGINATION_LIMIT);
      const total = await query.countDocuments();

      res.status(200).send({
        results: myAgreements,
        total,
        page: pageNumber,
        pages: Math.ceil(total / PAGINATION_LIMIT),
      });
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

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
        uniqueNumber: getAgreementUniqueNumber(),
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
