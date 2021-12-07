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

//@route GET v1/users/favorite
//@desc get favorite of user
//@access private
//@role user
router.get("/favorite", requireAuth, async (req, res) => {
  try {
    let userId = req.body.userAuth.id;

    await User.findById(userId)
      .select("-password")
      .populate({
        path: "favorite",
        populate: [
          {
            path: "category",
          },
          { path: "province" },
          { path: "tags" },
        ],
      })
      .exec(function (err, documents) {
        if (!err) {
          return res.status(200).json({
            success: true,
            message: "Get users favorite successfully",
            favorite: documents.favorite,
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Internal error server",
          });
        }
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
    const place = await Place.findById(req.params.placeId);
    if (!place) {
      return res.status(404).json({
        message: "Place not found ",
      });
    }
    //TODO: Check place is existed in favorite

    const userUpdatedCondition = { _id: req.body.userAuth.id };
    await User.findByIdAndUpdate(
      userUpdatedCondition,
      { $addToSet: { favorite: req.params.placeId } },
      { new: true }
    )
      .populate("favorite")
      .exec(function (err, user) {
        if (!err) {
          return res.status(200).json({
            success: true,
            message: "Update success",
            user: user,
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Internal error server",
          });
        }
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

//@route POST v1/users/profiles
//@desc update profile of user
//@access private
//@role user
router.post("/profiles", requireAuth, async (req, res, next) => {
  //Just update profile of this token
  let userId = req.body.userAuth.id;
  await User.findByIdAndUpdate(
    { _id: userId },
    {
      $set: { fullName: req.body.fullName, image: req.body.image },
    },
    { new: true }
  )
    .populate("recentSearch.place")
    .exec(function (err, documents) {
      if (!err) {
        res.status(200).json({
          message: "Update success",
          success: true,
          user: documents,
        });
      } else {
        res.status(500).json({
          message: "Internal error server",
          success: false,
        });
      }
    });
});

//@route PUT v1/users/recentView/:placeId
//@desc add new favorite place
//@access private
//@role user
router.put("/recentSearch/:placeId", requireAuth, async (req, res) => {
  try {
    let place = await Place.findById(req.params.placeId);
    if (!place) {
      return res.status(404).json({
        message: "Place not found ",
      });
    }

    //Save to viewCount in Place
    place = await Place.findByIdAndUpdate(
      req.params.placeId,
      {
        viewCount: place.viewCount + 1,
      },
      { new: true }
    );

    const userUpdatedCondition = { _id: req.body.userAuth.id };
    const user = await User.findById(req.body.userAuth.id);
    let recentPlace = user.recentSearch;
    let existed = recentPlace.find((item) => {
      return item.place.toString() === req.params.placeId.toString();
    });
    if (existed) {
      recentPlace = recentPlace.filter(
        (item) => item.place.toString() !== req.params.placeId.toString()
      );
      recentPlace.push({ place: req.params.placeId, time: formatTimeUTC() });
      recentPlace = recentPlace.sort((a, b) => b.time - a.time);
      let userUpdate = await User.findByIdAndUpdate(
        userUpdatedCondition,
        { recentSearch: recentPlace },
        { new: true }
      );
      User.populate(userUpdate, ["recentSearch.place"]).then((user_) => {
        return res.status(200).json({
          success: true,
          message: "That place existed",
          user: user_,
        });
      });
    } else {
      if (recentPlace.length >= 6) recentPlace = recentPlace.slice(0, 5);
      recentPlace.push({ place: req.params.placeId, time: formatTimeUTC() });
      recentPlace.sort((a, b) => b.time - a.time);
      let userUpdate = await User.findByIdAndUpdate(
        userUpdatedCondition,
        { recentSearch: recentPlace },
        { new: true }
      );

      User.populate(userUpdate, ["recentSearch.place"]).then((user) => {
        return res.status(200).json({
          success: true,
          message: "Update success",
          user: user,
        });
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

//@route GET v1/users/recentView
//@desc add new favorite place
//@access private
//@role user
router.get("/recentSearch", requireAuth, async (req, res) => {
  try {
    const userId = req.body.userAuth.id;
    let user = await User.findById(userId).populate("recentSearch.place");
    return res.status(200).json({
      success: true,
      message: "Update success",
      places: user.recentSearch,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//@route DELETE v1/users/favorite/:placeId
//@desc remove favorite place
//@access private
//@role user
router.delete("/favorite/:placeId", requireAuth, async (req, res) => {
  try {
    const place = await Place.findById(req.params.placeId);
    if (!place) {
      return res.status(404).json({
        message: "Place not found ",
      });
    }
    //TODO: Check place is existed in favorite

    const userUpdatedCondition = { _id: req.body.userAuth.id };
    await User.findByIdAndUpdate(
      userUpdatedCondition,
      { $pull: { favorite: req.params.placeId } },
      { new: true }
    )
      .populate("favorite")
      .exec(function (err, user) {
        if (!err) {
          return res.status(200).json({
            success: true,
            message: "Update success",
            user: user,
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Internal error server",
          });
        }
      });
  } catch (error) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});
module.exports = router;
