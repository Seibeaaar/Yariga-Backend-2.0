import { Router } from "express";
import { generateErrorMesaage } from "@/utils/common";
import Property from "@/models/Property";
import {
  verifyJWToken,
  fetchUserFromTokenData,
  checkIfLandlord,
} from "@/middlewares/common";
import { validatePropertyRequestBody } from "@/middlewares/property";
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

      const photoURLs = [];

      for (const file of req.files as Express.Multer.File[]) {
        const url = await uploadPhotoToAWS(file);
        photoURLs.push(url);
      }

      const property = new Property({
        ...req.body,
        photos: photoURLs,
      });
      await property.save();

      const { userId, user } = res.locals;
      await User.findByIdAndUpdate(
        userId,
        {
          properties: [...(user.properties || []), property.id],
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

export default PropertyRouter;
