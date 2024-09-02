import { Router } from "express";
import { generateErrorMesaage } from "@/utils/common";
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

const PropertyRouter = Router();

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
