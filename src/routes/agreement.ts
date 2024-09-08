import {
  checkAgreementIdParam,
  checkIsAgreementCounterpart,
  checkIsAgreementOwner,
  validateAgreementEntities,
  validateAgreementFilters,
  validateAgreementRequestBody,
  validateArchivedAgreementFilters,
  validateGetTotalByIntervalRequest,
} from "@/middlewares/agreement";
import {
  checkIfTenant,
  fetchUserFromTokenData,
  verifyJWToken,
} from "@/middlewares/common";
import Agreement from "@/models/Agreement";
import Property from "@/models/Property";
import User from "@/models/User";
import {
  AGREEMENT_STATUS,
  AGREEMENT_TOTAL_INTERVAL,
  AGREEMENT_TYPE,
  AgreementDocument,
} from "@/types/agreement";
import { PROPERTY_STATUS } from "@/types/property";
import { USER_ROLE } from "@/types/user";
import { generateErrorMesaage, makePaginatedRequest } from "@/utils/common";
import {
  calculateTotalByMonth,
  calculateTotalByWeeks,
  calculateTotalByYears,
  getAgreementUniqueNumber,
} from "@/utils/agreement";
import { Router } from "express";
import {
  ARCHIVED_AGREEMENT_STATUSES,
  NON_ARCHIVED_AGREEMENT_STATUSES,
} from "@/constants/agreement";
import { calculateTotalByDays } from "@/utils/agreement";

const AgreementRouter = Router();

AgreementRouter.get(
  "/",
  verifyJWToken,
  fetchUserFromTokenData,
  validateAgreementFilters,
  async (req, res) => {
    try {
      const { user } = res.locals;
      const query = {
        [user.role === USER_ROLE.Landlord ? "landlord" : "tenant"]: user.id,
        isArchived: false,
        status: {
          $in: req.query.status ?? NON_ARCHIVED_AGREEMENT_STATUSES,
        },
        type: {
          $in: req.query.type ?? Object.values(AGREEMENT_TYPE),
        },
      };

      const paginatedResponse = await makePaginatedRequest<AgreementDocument>(
        Agreement,
        query,
        req.query.page as string | undefined,
      );

      res.status(200).send(paginatedResponse);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

AgreementRouter.get(
  "/archived",
  verifyJWToken,
  fetchUserFromTokenData,
  validateArchivedAgreementFilters,
  async (req, res) => {
    try {
      const { user } = res.locals;
      const query = {
        [user.role === USER_ROLE.Landlord ? "landlord" : "tenant"]: user.id,
        isArchived: true,
        status: {
          $in: req.query.status ?? ARCHIVED_AGREEMENT_STATUSES,
        },
        type: {
          $in: req.query.type ?? Object.values(AGREEMENT_TYPE),
        },
      };

      const paginatedResponse = await makePaginatedRequest(
        Agreement,
        query,
        req.query.page as string | undefined,
      );

      res.status(200).send(paginatedResponse);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

AgreementRouter.get("/search", verifyJWToken, async (req, res) => {
  try {
    const { q = "", page } = req.query;

    const query = {
      uniqueNumber: {
        $regex: new RegExp(q as string, "i"),
      },
    };

    const paginatedResponse = await makePaginatedRequest(
      Agreement,
      query,
      page as string | undefined,
    );

    res.status(200).send(paginatedResponse);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

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
      res.status(201).send(agreement);
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
          $addToSet: {
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

AgreementRouter.post(
  "/:id/counter",
  verifyJWToken,
  checkAgreementIdParam,
  checkIsAgreementCounterpart,
  validateAgreementRequestBody,
  validateAgreementEntities,
  async (req, res) => {
    try {
      const { userId, agreement } = res.locals;
      const counterAgreement = new Agreement({
        ...req.body,
        creator: userId,
        parent: agreement.id,
        uniqueNumber: getAgreementUniqueNumber(),
      });

      await counterAgreement.save();
      await Agreement.findByIdAndUpdate(
        agreement.id,
        {
          isArchived: true,
          status: AGREEMENT_STATUS.Countered,
        },
        {
          new: true,
        },
      );

      res.status(201).send(counterAgreement);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

AgreementRouter.delete(
  "/:id",
  verifyJWToken,
  checkAgreementIdParam,
  checkIsAgreementOwner,
  async (req, res) => {
    try {
      const { agreement } = res.locals;

      await Agreement.findByIdAndDelete(agreement.id);
      await Agreement.updateMany(
        {
          parent: agreement.id,
        },
        {
          $set: { parent: null },
        },
      );

      res
        .status(200)
        .send(`Agreement ${agreement.id} was deleted successfully`);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

AgreementRouter.put(
  "/:id/update",
  verifyJWToken,
  fetchUserFromTokenData,
  checkAgreementIdParam,
  checkIsAgreementOwner,
  validateAgreementRequestBody,
  validateAgreementEntities,
  async (req, res) => {
    try {
      const { agreement } = res.locals;
      const updatedAgreement = await Agreement.findByIdAndUpdate(agreement.id, {
        ...req.body,
        updatedAt: new Date().toISOString(),
      });

      res.status(200).send(updatedAgreement);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

AgreementRouter.get(
  "/totalByInterval",
  verifyJWToken,
  fetchUserFromTokenData,
  validateGetTotalByIntervalRequest,
  async (req, res) => {
    try {
      const { interval } = req.query;
      const { user } = res.locals;

      const calculateFunctions = {
        [AGREEMENT_TOTAL_INTERVAL.Daily]: calculateTotalByDays,
        [AGREEMENT_TOTAL_INTERVAL.Weekly]: calculateTotalByWeeks,
        [AGREEMENT_TOTAL_INTERVAL.Monthly]: calculateTotalByMonth,
        [AGREEMENT_TOTAL_INTERVAL.Yearly]: calculateTotalByYears,
      };

      const calculator =
        calculateFunctions[interval as AGREEMENT_TOTAL_INTERVAL];
      const totalByIntervals = await calculator(user);

      res.status(200).send(totalByIntervals);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

export default AgreementRouter;
