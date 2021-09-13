const Review = require("../models/Review");

const mongoose = require("mongoose").set("useFindAndModify", false);
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const { formatTimeUTC_ } = require("../utils/Timezone");

//@route POST v1/reviews
//@desc create review
//@access private
//@role user
router.post("/", requireAuth, async (req, res, next) => {
    try {
        const reviewer = req.body.userAuth;
        //Validate
        const { title, content, rate, visitedTime, place } = req.body;
        if (!(title && content && rate && visitedTime && place))
            return res.status(400).json({
                success: false,
                message: "Missing some fields",
            });

        let newReview = new Review({
            title: title,
            content: content,
            rate: rate,
            visitedTime: formatTimeUTC_(new Date(visitedTime)),
            user: reviewer.id,
            place: place,
        });

        newReview = await newReview.save();
        if (newReview)
            return res.json({
                success: true,
                message: "Create review successfully",
                review: newReview,
            });
        else
            return res.status(500).json({
                success: false,
                message: "Create review successfully",
            });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal error server",
        });
    }
});

//@route GET v1/reviews/:placeId
//@desc GET review by placeId
//@access private
//@role
router.get("/:placeId", requireAuth, async (req, res, next) => {
    try {
        const placeId = req.params.placeId;
        if (!mongoose.Types.ObjectId.isValid(placeId))
            return res.status(400).json({
                success: false,
                message: "Invalid placeId",
            });

        let reviews = [];
        reviews = await Review.find({ place: placeId, isHidden: false });
        if (reviews) {
            return res.json({
                success: true,
                message: "Get reviews successfully",
                reviews: reviews,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Get reviews unsucceesfully",
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: "Internal error server",
        });
    }
});

//@route PUT v1/reviews/like/:reviewId
//@desc update like count  by reviewId
//@access private
//@role user

router.put("/liked/:reviewId", requireAuth, async (req, res, next) => {
    try {
        const user = req.body.userAuth;

        const reviewId = req.params.reviewId;
        if (!mongoose.Types.ObjectId.isValid(reviewId))
            return res.status(400).json({
                success: false,
                message: "Invalid reviewId",
            });

        let review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review can not found",
            });
        }

        if (review.likedUser.includes(user.id)) {
            //user unliked
            const index = review.likedUser.indexOf(user.id);
            if (index > -1) {
                review.likedUser.splice(index, 1);
            }
            review.likeCount--;
            review.updateddAt = formatTimeUTC();
            const result = await review.save();
            if (result)
                return res.json({
                    success: true,
                    message: "Update like review successfully",
                    review: result,
                });
            return res.status(500).json({
                success: false,
                message: "Update like review unsuccessfully",
            });
        } else {
            //user liked review
            review.likedUser.push(user.id);
            review.likeCount++;
            review.updateddAt = formatTimeUTC;
            const result = await review.save();
            if (result)
                return res.json({
                    success: true,
                    message: "Update like review successfully",
                    review: result,
                });
            return res.status(500).json({
                success: false,
                message: "Update like review unsuccessfully",
            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: "Internal error server",
        });
    }
});


//@route PUT v1/reviews/delete/:reviewId
//@desc update isHidden by reviewId
//@access private
//@role user

router.put('/delete/:reviewId', requireAuth, async (req, res, next) => {
    try {

        let reviewer = req.body.userAuth;
        if (!mongoose.Types.ObjectId.isValid(req.params.reviewId))
            return res.status(400).json({
                success: false,
                message: "Invalid reviewId",
            });

        let reviewUpdate = {
            isHidden: true,
            updatedAt: Date.now(),
        };

        reviewUpdate = await Review.findOneAndUpdate(
            { _id: req.params.reviewId, user: reviewer.id },
            reviewUpdate,
            { new: true }
        );

        if (reviewUpdate) {
            res.json({
                success: true,
                message: "Delete review successfully",
                plan: reviewUpdate,
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Delete review unsuccessfully",
            });
        }

    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            success: false,
            message: "Internal error server",
        });
    }
})

module.exports = router;
