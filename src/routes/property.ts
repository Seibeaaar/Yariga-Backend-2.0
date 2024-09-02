import { Router } from "express";
import { generateErrorMesaage, processPageQueryParam } from "@/utils/common";
import Property from "@/models/Property";
import {
  verifyJWToken,
  checkIfLandlord,
  fetchUserFromTokenData,
} from "@/middlewares/common";
import {
  checkPropertyByIdParam,
  checkPropertyOwnership,
  validatePropertyRequestBody,
} from "@/middlewares/property";
import User from "@/models/User";
import { upload, uploadPhotoToAWS } from "@/utils/media";
import { PAGINATION_LIMIT } from "@/constants/common";
import { buildPropertyFiltersQuery } from "@/utils/property";
import { validatePropertyPreferences } from "@/middlewares/user";

const PropertyRouter = Router();

PropertyRouter.get("/", verifyJWToken, async (req, res) => {
  try {
    const pageNumber = processPageQueryParam(
      req.query.page as string | undefined,
    );
    const startIndex = (pageNumber - 1) * PAGINATION_LIMIT;

    const properties = await Property.find()
      .skip(startIndex)
      .limit(PAGINATION_LIMIT);
    const total = await Property.countDocuments();

    res.status(200).send({
      total,
      page: pageNumber,
      pages: Math.ceil(total / PAGINATION_LIMIT),
      results: properties,
    });
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

PropertyRouter.post("/search", verifyJWToken, async (req, res) => {
  try {
    const { q = "", page } = req.query;
    const pageNumber = processPageQueryParam(page as string | undefined);
    const startIndex = (pageNumber - 1) * PAGINATION_LIMIT;

    const regex = new RegExp(q as string, "i");

    const results = await Property.find({
      $or: [
        {
          "location.title": { $regex: regex },
        },
        { description: { $regex: regex } },
        { title: { $regex: regex } },
      ],
    })
      .skip(startIndex)
      .limit(PAGINATION_LIMIT);

    const total = results.length;

    res.status(200).send({
      total,
      page: pageNumber,
      pages: Math.ceil(total / PAGINATION_LIMIT),
      results,
    });
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
      const pageNumber = processPageQueryParam(
        req.params.page as string | undefined,
      );
      const startIndex = (pageNumber - 1) * PAGINATION_LIMIT;

      const results = await Property.find(filtersQuery)
        .skip(startIndex)
        .limit(PAGINATION_LIMIT);
      const total = results.length;

      res.status(200).send({
        total,
        page: pageNumber,
        pages: Math.ceil(total / PAGINATION_LIMIT),
        results,
      });
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

export default PropertyRouter;