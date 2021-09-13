const Plan = require("../models/Plan");
const User = require("../models/User");
const mongoose = require("mongoose").set("useFindAndModify", false);
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const { formatTimeUTC, formatTimeUTC_ } = require("../utils/Timezone");


//@route GET v1/plans
//@desc get plan by userId
//@access private
//@role user
router.get("/", requireAuth, async (req, res, next) => {
    try {
        const planner = req.body.userAuth;
        let plans = [];
        plans = await Plan.find({ user: planner.id, isHidden: false });
        if (plans) {
            return res.status(200).json({
                success: true,
                message: "Get plan successfully",
                plans: plans,
            });
        }
        res.status(500).json({
            success: false,
            message: "Get plan unsuccessfully",
        });
    } catch (error) {
        console.log(err.message);
        res.status(500).json({
            success: false,
            message: "Internal error server",
        });
    }
});

//@route POST v1/plans
//@desc create new plan
//@access private
//@role user
router.post("/", requireAuth, async (req, res, next) => {
    try {
        const currentTime = Date.now()
        const planner = req.body.userAuth;
        let plan = new Plan({
            name: req.body.name,
            start: new Date(formatTimeUTC_(req.body.start)),
            end: formatTimeUTC_(req.body.end),
            note: req.body.note,
            photoUrl:
                (req.body.photoUrl.startsWith("https://")
                    ? req.body.photoUrl
                    : `https://${req.body.photoUrl}`) || "",
            user: planner.id,
        });

        plan = await plan.save();
        if (plan) {
            return res.json({
                success: true,
                message: "Create plan successfully",
                plan: plan,
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Create plan unsuccessfully",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal error server",
        });
    }
});

//@route PUT v1/plans/:planId
//@desc update plan by planId
//@access private
//@role user

router.put("/:planId", requireAuth, async (req, res, next) => {
    try {
        let planer = req.body.userAuth;
        if (!mongoose.Types.ObjectId.isValid(req.params.planId))
            return res.status(400).json({
                success: false,
                message: "Invalid planId",
            });

        //Get plan by id
        let originPlan = await Plan.findOne({
            _id: req.params.planId,
            user: planer.id,
        });

        if (!originPlan)
            return res.status(400).json({
                success: false,
                message: "Invalid planId or user",
            });

        //Initialize updated plan

        let planUpdate = {
            name: req.body.name ? req.body.name : originPlan.name,
            start: req.body.start ? req.body.start : originPlan.start,
            end: req.body.end ? req.body.end : originPlan.end,
            note: req.body.note ? req.body.note : originPlan.note,
            photoUrl: req.body.photoUrl ? req.body.photoUrl : originPlan.photoUrl,
            updatedAt: formatTimeUTC()
        };

        planUpdate = await Plan.findOneAndUpdate(
            { _id: req.params.planId, user: planer.id },
            planUpdate,
            { new: true }
        );
        res.json({
            success: true,
            message: "Update plan successfully",
            plan: planUpdate,
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal error server",
        });
    }
});

//@route PUT v1/plans/delete/:planId
//@desc update plan when user delete
//@access private
//@role user
router.delete("/:planId", requireAuth, async (req, res, next) => {
    try {
        let planer = req.body.userAuth;
        if (!mongoose.Types.ObjectId.isValid(req.params.planId))
            return res.status(400).json({
                success: false,
                message: "Invalid planId",
            });

        let planUpdate = {
            isHidden: true,
            updatedAt: formatTimeUTC(),
        };

        planUpdate = await Plan.findOneAndUpdate(
            { _id: req.params.planId, user: planer.id },
            planUpdate,
            { new: true }
        );

        if (planUpdate) {
            res.json({
                success: true,
                message: "Delete plan successfully",
                plan: planUpdate,
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Delete plan unsuccessfully",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal error server",
        });
    }
});

module.exports = router;
