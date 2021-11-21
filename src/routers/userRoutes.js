const User = require("../models/User");
const Place = require("../models/Place");
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const { UserRefreshClient } = require("google-auth-library");
const { formatTimeUTC } = require("../utils/Timezone");

//@route GET v1/users
//@desc get all users
//@access private
//@role any
router.get("/", requireAuth, async (req, res) => {
  try {
    let userList = [];
    if (req.query.populate == "true") {
      //Get object foreign key
      userList = await User.find().select("-password").populate("favorite");
    } else {
      userList = await User.find()
        .select("-password")
        .populate("favorite", ["-__v"]);
    }

    //Not found
    if (!userList) {
      return res.status(404).json({
        success: false,
        message: "Users not found",
        users: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Get all users sucessfully",
      users: userList,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//@route PUT v1/users/favorite/:placeId
//@desc add new favorite place
//@access private
//@role user
router.put("/favorite/:placeId", requireAuth, async (req, res) => {
  try {
    console.log(req.params.placeId);

    const place = await Place.findById(req.params.placeId);
    if (!place) {
      return res.status(404).json({
        message: "Place not found ",
      });
    }
    //TODO: Check place is existed in favorite

    const userUpdatedCondition = { _id: req.body.userAuth.id };
    const userUpdate = await User.findByIdAndUpdate(
      userUpdatedCondition,
      { $addToSet: { favorite: req.params.placeId } },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Update success",
      user: userUpdate,
    });
  } catch (error) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});
//@route PUT v1/users
//@desc Disable account user
//@access private
//@role admin
router.put("/:userId/status", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      const userUpdatedCondition = { _id: req.body.id };
      await User.findByIdAndUpdate(
        userUpdatedCondition,
        { $set: { isHidden: req.body.isHidden } },
        { new: true },
        function (err, documents) {
          if (!err) {
            User.populate(documents, ["favorite"], function (err) {
              return res.status(200).json({
                success: true,
                message: "Update success",
                user: documents,
              });
            });
          }
        }
      );
    } catch (error) {
      console.log(err.message);
      res.status(500).json({
        success: false,
        message: "Internal error server",
      });
    }
  })
);

//@route PUT v1/users/recentView/:placeId
//@desc add new favorite place
//@access private
//@role user
router.put("/recentSearch/:placeId", requireAuth, async (req, res) => {
  try {
    const place = await Place.findById(req.params.placeId);
    if (!place) {
      return res.status(404).json({
        message: "Place not found ",
      });
    }

    const userUpdatedCondition = { _id: req.body.userAuth.id };
    const user = await User.findById(req.body.userAuth.id);
    let recentPlace = user.recentSearch;
    let existed = recentPlace.find((item) => {
      return item.place.toString() === req.params.placeId.toString();
    });
    if (existed)
      return res.status(200).json({
        success: true,
        message: "That place existed",
        user: user,
      });
    if (recentPlace.length >= 8) recentPlace = recentPlace.slice(1, 7);
    recentPlace.push({ place: req.params.placeId, time: formatTimeUTC() });

    const userUpdate = await User.findByIdAndUpdate(
      userUpdatedCondition,
      { recentSearch: recentPlace },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Update success",
      user: userUpdate,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});
module.exports = router;
