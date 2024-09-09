import { Router } from "express";
import { verifyJWToken } from "@/middlewares/common";
import {
  validateReviewRequestBody,
  validateReviewedObject,
} from "@/middlewares/review";
import { generateErrorMesaage, makePaginatedRequest } from "@/utils/common";
import Review from "@/models/Review";
import { REVIEW_OBJECT } from "@/types/review";
import User from "@/models/User";
import Property from "@/models/Property";

const ReviewRouter = Router();

ReviewRouter.post(
  "/add",
  verifyJWToken,
  validateReviewRequestBody,
  validateReviewedObject,
  async (req, res) => {
    try {
      const { userId } = res.locals;
      const review = new Review({
        ...req.body,
        reviewer: userId,
      });

      const { rating } = req.body;
      const updateRatingQuery = {
        $inc: { votes: 1 },
        $set: {
          rating: {
            $divide: [
              { $add: [{ $multiply: ["$rating", "$votes"] }, rating] },
              { $add: ["$votes", 1] },
            ],
          },
        },
      };

      if (req.body.object === REVIEW_OBJECT.User) {
        await User.findByIdAndUpdate(req.body.reviewee, updateRatingQuery, {
          new: true,
        });
      } else {
        await Property.findByIdAndUpdate(req.body.reviewee, updateRatingQuery, {
          new: true,
        });
      }

      await review.save();
      res.status(201).send(review);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

ReviewRouter.get("/received", verifyJWToken, async (req, res) => {
  try {
    const { userId } = res.locals;
    const query = {
      reviewee: userId,
    };

    const paginatedResponse = await makePaginatedRequest(
      Review,
      query,
      req.query.page as string | undefined,
    );
    res.status(200).send(paginatedResponse);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

ReviewRouter.get("/sent", verifyJWToken, async (req, res) => {
  try {
    const { userId } = res.locals;
    const query = {
      reviewer: userId,
    };

    const paginatedResponse = await makePaginatedRequest(
      Review,
      query,
      req.query.page as string | undefined,
    );
    res.status(200).send(paginatedResponse);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

export default ReviewRouter;
