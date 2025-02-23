import {
  checkAgreementIdParam,
  checkIsAgreementCounterpart,
  checkIsAgreementOwner,
  validateAgreementProperty,
  validateAgreementFilters,
  validateAgreementCreate,
  validateAgreementUpdateDetails,
  validateGetTotalByIntervalRequest,
  checkIsAgreementPart,
} from "@/middlewares/agreement";
import {
  checkIfTenant,
  fetchUserFromTokenData,
  verifyJWToken,
} from "@/middlewares/common";
import Agreement from "@/models/Agreement";
import Property from "@/models/Property";
import User from "@/models/User";
import { AGREEMENT_STATUS, AGREEMENT_TOTAL_INTERVAL } from "@/types/agreement";
import { PROPERTY_STATUS } from "@/types/property";
import { USER_ROLE } from "@/types/user";
import {
  convertQueryParamToBoolean,
  generateErrorMesaage,
  makePaginatedRequest,
} from "@/utils/common";
import {
  getAgreementUniqueNumber,
  populateAgreement,
} from "@/utils/agreement/shared";
import { Router } from "express";
import {
  buildAgreementFilterQuery,
  buildAgreementGetQuery,
} from "@/utils/agreement/filter";
import {
  calculateTotalByDays,
  calculateTotalByWeeks,
  calculateTotalByMonth,
  calculateTotalByYears,
} from "@/utils/agreement/totals";
import { sendNotification } from "@/utils/notification";
import { NOTIFICATION_TYPE } from "@/types/notification";

const AgreementRouter = Router();

AgreementRouter.get(
  "/",
  verifyJWToken,
  fetchUserFromTokenData,
  async (req, res) => {
    try {
      const { user } = res.locals;
      const query = buildAgreementGetQuery(
        user,
        convertQueryParamToBoolean(req.query.isArchived as string | undefined),
        req.query.createdBy as string | undefined,
      );

      const paginatedResponse = await makePaginatedRequest({
        model: Agreement,
        query,
        page: req.query.page as string | undefined,
        populate: [
          {
            path: "property",
          },
        ],
      });

      res.status(200).send(paginatedResponse);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

AgreementRouter.get(
  "/search",
  verifyJWToken,
  fetchUserFromTokenData,
  async (req, res) => {
    try {
      const { q = "", page, createdBy, isArchived } = req.query;
      const { user } = res.locals;

      const getQuery = buildAgreementGetQuery(
        user,
        convertQueryParamToBoolean(isArchived as string | undefined),
        createdBy as string | undefined,
      );

      const query = {
        uniqueNumber: {
          $regex: new RegExp(q as string, "i"),
        },
        ...getQuery,
      };

      const paginatedResponse = await makePaginatedRequest({
        model: Agreement,
        query,
        page: page as string | undefined,
        populate: [
          {
            path: "property",
          },
        ],
      });

      res.status(200).send(paginatedResponse);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

AgreementRouter.post(
  "/filter",
  verifyJWToken,
  fetchUserFromTokenData,
  validateAgreementFilters,
  async (req, res) => {
    try {
      const { user, isArchived } = res.locals;

      const getQuery = buildAgreementGetQuery(
        user,
        isArchived,
        req.query.createdBy as string | undefined,
      );

      const filterQuery = buildAgreementFilterQuery(isArchived, req.body);

      const combinedQuery = {
        ...getQuery,
        ...filterQuery,
      };

      const paginatedResponse = await makePaginatedRequest({
        model: Agreement,
        query: combinedQuery,
        page: req.query.page as string | undefined,
        populate: [
          {
            path: "property",
          },
        ],
      });

      res.status(200).send(paginatedResponse);
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
  validateAgreementCreate,
  validateAgreementProperty,
  async (req, res) => {
    try {
      const { user, landlord } = res.locals;
      const agreement = new Agreement({
        ...req.body,
        creator: user.id,
        tenant: user.id,
        landlord,
        uniqueNumber: getAgreementUniqueNumber(),
      });
      await agreement.save();

      await sendNotification({
        sender: user,
        landlord,
        tenant: user.id,
        type: NOTIFICATION_TYPE.NewAgreement,
      });

      const expandedAgreement = await populateAgreement(agreement);

      res.status(201).send(expandedAgreement);
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

      await sendNotification({
        sender: user,
        landlord: agreement.landlord,
        tenant: agreement.tenant,
        type: NOTIFICATION_TYPE.AgreementAccepted,
      });

      const expandedAgreement = await populateAgreement(acceptedAgreement);

      res.status(200).send(expandedAgreement);
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

      const expandedAgreement = await populateAgreement(declinedAgreement);

      await sendNotification({
        sender: user,
        landlord: agreement.landlord,
        tenant: agreement.tenant,
        type: NOTIFICATION_TYPE.AgreementDeclined,
      });

      res.status(200).send(expandedAgreement);
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
  validateAgreementUpdateDetails,
  async (req, res) => {
    try {
      const { user, agreement } = res.locals;

      const isCallerTenant = user.role === USER_ROLE.Tenant;

      const tenant = isCallerTenant ? user.id : agreement.tenant;
      const landlord = isCallerTenant ? agreement.landlord : user.id;

      const counterAgreement = new Agreement({
        ...req.body,
        creator: user.id,
        parent: agreement.id,
        property: agreement.property,
        tenant,
        landlord,
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

      await sendNotification({
        sender: user,
        landlord,
        tenant,
        type: NOTIFICATION_TYPE.AgreementCountered,
      });

      const expandedAgreement = await populateAgreement(counterAgreement);

      res.status(201).send(expandedAgreement);
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
  "/:id",
  verifyJWToken,
  fetchUserFromTokenData,
  checkAgreementIdParam,
  checkIsAgreementOwner,
  validateAgreementUpdateDetails,
  async (req, res) => {
    try {
      const { agreement } = res.locals;
      const updatedAgreement = await Agreement.findByIdAndUpdate(agreement.id, {
        ...req.body,
        updatedAt: new Date().toISOString(),
      });
      const expandedAgreement = await populateAgreement(updatedAgreement);

      res.status(200).send(expandedAgreement);
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

AgreementRouter.get(
  "/:id",
  verifyJWToken,
  checkAgreementIdParam,
  checkIsAgreementPart,
  async (req, res) => {
    try {
      const { agreement } = res.locals;

      const expanedAgreement = await populateAgreement(agreement);

      res.status(200).send(expanedAgreement);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

export default AgreementRouter;
