import { Router } from "express";
import { verifyJWToken } from "@/middlewares/common";
import {
  checkIsReviewer,
  checkReviewIdParam,
  validateReviewRequestBody,
  validateReviewedObject,
} from "@/middlewares/review";
import { generateErrorMesaage, makePaginatedRequest } from "@/utils/common";
import Review from "@/models/Review";
import { RATING_UPDATE } from "@/types/review";
import { updateRevieweeRating } from "@/utils/review";

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

      const { rating, reviewee, object } = req.body;
      await updateRevieweeRating(
        reviewee,
        object,
        rating,
        RATING_UPDATE.Increase,
      );

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

ReviewRouter.put(
  "/:id/update",
  verifyJWToken,
  checkReviewIdParam,
  checkIsReviewer,
  validateReviewRequestBody,
  validateReviewedObject,
  async (req, res) => {
    try {
      const updatedReview = await Review.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          updatedAt: new Date().toISOString(),
        },
        { new: true },
      );

      const { rating, reviewee, object } = req.body;
      await updateRevieweeRating(
        reviewee,
        object,
        rating,
        RATING_UPDATE.Recalculate,
      );

      res.status(200).send(updatedReview);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

ReviewRouter.delete(
  "/:id",
  verifyJWToken,
  checkReviewIdParam,
  checkIsReviewer,
  async (req, res) => {
    try {
      const {
        review: { id, reviewee, object, rating },
      } = res.locals;

      await Review.findByIdAndDelete(id);
      await updateRevieweeRating(
        reviewee,
        object,
        rating,
        RATING_UPDATE.Decrease,
      );

      res.status(200).send(`Review with id ${id} was deleted successfully`);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

export default ReviewRouter;
