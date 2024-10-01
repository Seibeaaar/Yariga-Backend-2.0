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
  checkPropertyByIdParam,
  checkPropertyOwnership,
  validatePropertyRequestBody,
} from "@/middlewares/property";
import { PropertyDoc } from "@/types/property";
import User from "@/models/User";
import { upload, uploadPhotoToAWS } from "@/utils/media";
import { RECOMMENDATIONS_TOTAL_LIMIT } from "@/constants/common";
import { buildPropertyFiltersQuery } from "@/utils/property";
import { validatePropertyPreferences } from "@/middlewares/user";

const PropertyRouter = Router();

PropertyRouter.get("/", verifyJWToken, async (req, res) => {
  try {
    const paginatedResponse = await makePaginatedRequest<PropertyDoc>(
      Property,
      {},
      req.query.page as string | undefined,
    );

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
      const paginatedResponse = await makePaginatedRequest<PropertyDoc>(
        Property,
        {
          owner: userId,
        },
        req.query.page as string | undefined,
      );

      res.status(200).send(paginatedResponse);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

PropertyRouter.get("/search", verifyJWToken, async (req, res) => {
  try {
    const { q = "", page } = req.query;
    const regex = new RegExp(q as string, "i");
    const query = {
      $or: [
        {
          "location.title": { $regex: regex },
        },
        { description: { $regex: regex } },
        { title: { $regex: regex } },
      ],
    };

    const paginatedResponse = await makePaginatedRequest<PropertyDoc>(
      Property,
      query,
      page as string | undefined,
    );

    res.status(200).send(paginatedResponse);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

PropertyRouter.post(
  "/filter",
  verifyJWToken,
  validatePropertyPreferences,
  async (req, res) => {
    try {
      const filtersQuery = buildPropertyFiltersQuery(req.body);
      const paginatedResponse = await makePaginatedRequest<PropertyDoc>(
        Property,
        filtersQuery,
        req.query.page as string | undefined,
      );

      res.status(200).send(paginatedResponse);
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
  upload.array("photos"),
  validatePropertyRequestBody,
  async (req, res) => {
    try {
      if (!req.files || !req.files.length) {
        return res.status(400).send("Property photos required");
      }
      const { userId } = res.locals;
      const photoURLs = [];

      for (const file of req.files as Express.Multer.File[]) {
        const url = await uploadPhotoToAWS(file);
        photoURLs.push(url);
      }

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
  "/update/:id",
  verifyJWToken,
  checkPropertyByIdParam,
  checkPropertyOwnership,
  upload.array("photos"),
  validatePropertyRequestBody,
  async (req, res) => {
    try {
      if (!req.files || !req.files.length) {
        return res.status(400).send("Property photos required");
      }
      const { property } = res.locals;
      const updatedProperty = await Property.findByIdAndUpdate(
        property.id,
        req.body,
        {
          new: true,
        },
      );

      res.status(200).send(updatedProperty);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

PropertyRouter.delete(
  "/delete/:id",
  verifyJWToken,
  checkPropertyByIdParam,
  checkPropertyOwnership,
  async (req, res) => {
    try {
      const { userId, property } = res.locals;

      await Property.findByIdAndDelete(property.id);
      await User.findByIdAndUpdate(userId, {
        $pull: {
          properties: property.id,
        },
      });

      res.status(200).send(`Property ${property.id} deleted successfully.`);
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

      const paginatedResponse = await makePaginatedRequest(
        Property,
        query,
        req.query.page as string | undefined,
        RECOMMENDATIONS_TOTAL_LIMIT,
      );

      res.status(200).send(paginatedResponse);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

export default PropertyRouter;
