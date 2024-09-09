import { RATING_UPDATE, REVIEW_OBJECT } from "@/types/review";
import Property from "@/models/Property";
import User from "@/models/User";

const buildRatingUpdateQuery = (rating: number, update: RATING_UPDATE) => {
  switch (update) {
    case RATING_UPDATE.Decrease:
      return {
        $inc: { votes: -1 },
        $set: {
          rating: {
            $cond: {
              if: { $eq: ["$votes", 1] },
              then: 0,
              else: {
                $divide: [
                  { $subtract: [{ $multiply: ["$rating", "$votes"] }, rating] },
                  { $subtract: ["$votes", 1] },
                ],
              },
            },
          },
        },
      };
    case RATING_UPDATE.Recalculate:
      return {
        $set: {
          rating: {
            $divide: [{ $add: [{ $multiply: ["$rating", "$votes"] }, rating] }],
          },
        },
      };

    case RATING_UPDATE.Increase:
      return {
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
  }
};

export const updateRevieweeRating = async (
  reviewee: string,
  object: REVIEW_OBJECT,
  rating: number,
  update: RATING_UPDATE,
) => {
  const query = buildRatingUpdateQuery(rating, update);
  if (object === REVIEW_OBJECT.User) {
    await User.findByIdAndUpdate(reviewee, query, {
      new: true,
    });
  } else {
    await Property.findByIdAndUpdate(reviewee, query, {
      new: true,
    });
  }
};
