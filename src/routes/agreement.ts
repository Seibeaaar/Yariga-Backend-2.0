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
import { createAgreementNotification } from "@/utils/notification";
import { NOTIFICATION_TYPE } from "@/types/notification";

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
      const { user } = res.locals;
      const agreement = new Agreement({
        ...req.body,
        creator: user.id,
        uniqueNumber: getAgreementUniqueNumber(),
      });
      await agreement.save();

      await createAgreementNotification(
        NOTIFICATION_TYPE.NewAgreement,
        user,
        agreement,
      );

      res.status(201).send(agreement);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

AgreementRouter.put(
  "/:id/accept",
  verifyJWToken,
  fetchUserFromTokenData,
  checkAgreementIdParam,
  checkIsAgreementCounterpart,
  async (req, res) => {
    try {
      const { agreement, user } = res.locals;
      const acceptedAgreement = await Agreement.findByIdAndUpdate(
        agreement.id,
        {
          status: AGREEMENT_STATUS.Accepted,
          updatedAt: new Date().toISOString(),
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

      await createAgreementNotification(
        NOTIFICATION_TYPE.AgreementAccepted,
        user,
        acceptedAgreement!,
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
  fetchUserFromTokenData,
  checkAgreementIdParam,
  checkIsAgreementCounterpart,
  async (req, res) => {
    try {
      const { agreement, user } = res.locals;
      const declinedAgreement = await Agreement.findByIdAndUpdate(
        agreement.id,
        {
          status: AGREEMENT_STATUS.Declined,
          isArchived: true,
          updatedAt: new Date().toISOString(),
        },
        {
          new: true,
        },
      );

      await createAgreementNotification(
        NOTIFICATION_TYPE.AgreementDeclined,
        user,
        declinedAgreement!,
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
  fetchUserFromTokenData,
  checkAgreementIdParam,
  checkIsAgreementCounterpart,
  validateAgreementRequestBody,
  validateAgreementEntities,
  async (req, res) => {
    try {
      const { user, agreement } = res.locals;
      const counterAgreement = new Agreement({
        ...req.body,
        creator: user.id,
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

      await createAgreementNotification(
        NOTIFICATION_TYPE.AgreementCountered,
        user,
        counterAgreement!,
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
  "/total",
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

AgreementRouter.get(
  "/latest",
  verifyJWToken,
  fetchUserFromTokenData,
  async (req, res) => {
    try {
      const { user } = res.locals;
      const latestAgreements = await Agreement.find({
        [user.role === USER_ROLE.Landlord ? "landlord" : "tenant"]: user.id,
        status: AGREEMENT_STATUS.Accepted,
      })
        .sort({
          updatedAt: -1,
        })
        .populate("property")
        .limit(5);

      res.status(200).send(latestAgreements);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

export default AgreementRouter;
