import { Router } from "express";
import { generateErrorMesaage, makePaginatedRequest } from "@/utils/common";
import Property from "@/models/Property";
import {
  verifyJWToken,
  checkIfLandlord,
  fetchUserFromTokenData,
  checkIfTenant,
} from "@/middlewares/common";
import {
  checkCanAddFirstProperty,
  checkPropertyByIdParam,
  checkPropertyNotSold,
  checkPropertyNumberLimit,
  checkPropertyOwnership,
  checkPropertySearchQuery,
  validateCreatePropertyRequest,
  validateUpdatePropertyRequest,
} from "@/middlewares/property";
import { PROPERTY_STATUS, PropertyDoc } from "@/types/property";
import User from "@/models/User";
import { deleteAWSPhotos, upload, uploadPhotosToAWS } from "@/utils/media";
import { RECOMMENDATIONS_TOTAL_LIMIT } from "@/constants/common";
import { buildPropertyFiltersQuery } from "@/utils/property";
import { validatePropertyPreferences } from "@/middlewares/user";

const PropertyRouter = Router();

PropertyRouter.get("/", verifyJWToken, async (req, res) => {
  try {
    const paginatedResponse = await makePaginatedRequest<PropertyDoc>({
      model: Property,
      query: {
        status: PROPERTY_STATUS.Free,
      },
      page: req.query.page as string | undefined,
    });

    res.status(200).send(paginatedResponse);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

PropertyRouter.get(
  "/mine",
  verifyJWToken,
  fetchUserFromTokenData,
  checkIfLandlord,
  async (req, res) => {
    try {
      const { userId } = res.locals;
      const myProperties = await Property.find({
        owner: userId,
      });

      res.status(200).send(myProperties);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

PropertyRouter.get(
  "/search",
  verifyJWToken,
  checkPropertySearchQuery,
  async (req, res) => {
    try {
      const { q, page } = req.query;
      const regex = new RegExp(q as string, "i");
      const query = {
        $or: [
          {
            "location.title": { $regex: regex },
          },
          { description: { $regex: regex } },
          { title: { $regex: regex } },
        ],
        status: PROPERTY_STATUS.Free,
      };

      const paginatedResponse = await makePaginatedRequest<PropertyDoc>({
        model: Property,
        query,
        page: page as string | undefined,
      });

      res.status(200).send(paginatedResponse);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

PropertyRouter.post(
  "/filter",
  verifyJWToken,
  validatePropertyPreferences,
  async (req, res) => {
    try {
      const filtersQuery = buildPropertyFiltersQuery(req.body);
      const paginatedResponse = await makePaginatedRequest<PropertyDoc>({
        model: Property,
        query: filtersQuery,
        page: req.query.page as string | undefined,
      });

      res.status(200).send(paginatedResponse);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

PropertyRouter.post(
  "/add-first",
  verifyJWToken,
  fetchUserFromTokenData,
  checkIfLandlord,
  checkCanAddFirstProperty,
  upload.array("photos[]"),
  validateCreatePropertyRequest,
  async (req, res) => {
    try {
      if (!req.files || !req.files.length) {
        return res.status(400).send("Property photos required");
      }
      const { userId } = res.locals;
      const photoURLs = await uploadPhotosToAWS(
        req.files as Express.Multer.File[],
      );

      const property = new Property({
        ...req.body,
        photos: photoURLs,
        owner: userId,
      });

      await property.save();
      await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            properties: property.id,
          },
          onboardingStep: null,
        },
        {
          new: true,
        },
      );

      res.status(201).send(property);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

PropertyRouter.post(
  "/add",
  verifyJWToken,
  fetchUserFromTokenData,
  checkIfLandlord,
  checkPropertyNumberLimit,
  upload.array("photos[]"),
  validateCreatePropertyRequest,
  async (req, res) => {
    try {
      if (!req.files || !req.files.length) {
        return res.status(400).send("Property photos required");
      }
      const { userId } = res.locals;
      const photoURLs = await uploadPhotosToAWS(
        req.files as Express.Multer.File[],
      );

      const property = new Property({
        ...req.body,
        photos: photoURLs,
        owner: userId,
      });

      await property.save();
      await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            properties: property.id,
          },
        },
        {
          new: true,
        },
      );

      res.status(201).send(property);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

PropertyRouter.put(
  "/:id",
  verifyJWToken,
  checkPropertyByIdParam,
  checkPropertyOwnership,
  upload.array("photos[]"),
  validateUpdatePropertyRequest,
  async (req, res) => {
    try {
      const { property } = res.locals;
      const deletedPhotoURLs = req.body.deletedPhotos || [];

      const allPhotosDeleted =
        property.photos.length === deletedPhotoURLs.length;
      const noNewPhotos = !req.files || !req.files.length;

      if (allPhotosDeleted && noNewPhotos) {
        return res.status(400).send("Property photos required");
      }

      await deleteAWSPhotos(deletedPhotoURLs);

      const newPhotoUrls = await uploadPhotosToAWS(
        req.files as Express.Multer.File[],
      );

      await Property.findByIdAndUpdate(property.id, {
        $pull: { photos: { $in: deletedPhotoURLs } },
      });

      const updatedProperty = await Property.findByIdAndUpdate(
        property.id,
        {
          ...req.body,
          $push: { photos: { $each: newPhotoUrls } },
        },
        { new: true },
      ).populate("owner", "-password");

      res.status(200).send(updatedProperty);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

PropertyRouter.patch(
  "/toggleVisibility/:id",
  verifyJWToken,
  checkPropertyByIdParam,
  checkPropertyOwnership,
  checkPropertyNotSold,
  async (req, res) => {
    try {
      const { property } = res.locals;
      const newStatus =
        property.status === PROPERTY_STATUS.Free
          ? PROPERTY_STATUS.Hidden
          : PROPERTY_STATUS.Free;
      const updatedProperty = await Property.findByIdAndUpdate(
        property.id,
        {
          status: newStatus,
        },
        {
          new: true,
        },
      ).populate("owner", "-password");

      res.status(200).send(updatedProperty);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

PropertyRouter.get(
  "/recommendations",
  verifyJWToken,
  fetchUserFromTokenData,
  checkIfTenant,
  async (req, res) => {
    try {
      const { user } = res.locals;
      const query = buildPropertyFiltersQuery(user.preferences || {});

      const paginatedResponse = await makePaginatedRequest({
        model: Property,
        query,
        page: req.query.page as string | undefined,
        totalLimit: RECOMMENDATIONS_TOTAL_LIMIT,
      });

      res.status(200).send(paginatedResponse);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

PropertyRouter.get(
  "/:id",
  verifyJWToken,
  checkPropertyByIdParam,
  async (req, res) => {
    try {
      const { property } = res.locals;
      const propertyWithOwner = await property.populate({
        path: "owner",
        select: "-password",
      });
      res.status(200).send(propertyWithOwner);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

export default PropertyRouter;
