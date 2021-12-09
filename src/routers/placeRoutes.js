const Place = require("../models/Place");
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const { formatTimeUTC } = require("../utils/Timezone");
const { STATUS } = require("../models/enum");
const updateRateVoting = require("../helpers/updateRateVoting");
const { Province } = require("../models/Province");

//@route GET v1/places/private
//@desc Get all places (public vs private)
//@access public
//@role any
router.get("/private", async (req, res) => {
  try {
    let placeList = [];
    if (req.query.populate == "true") {
      //Get object foreign key
      placeList = await Place.find()
        .populate("province")
        .populate("category")
        .populate("tags")
        .exec();
    } else {
      placeList = await Place.find();
    }
    return res.status(200).json({
      success: true,
      message: "Get places successfully",
      places: placeList,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

//@route GET v1/places
//@desc Get all places
//@access public
//@role any
router.get("/", async (req, res) => {
  try {
    let placeList = [];
    if (req.query.populate == "true") {
      //Get object foreign key
      placeList = await Place.find({
        status: STATUS.PUBLIC,
      })
        .populate("province")
        .populate("category")
        .populate("tags")
        .exec();
    } else {
      placeList = await Place.find({ status: STATUS.PUBLIC });
    }
    return res.status(200).json({
      success: true,
      message: "Get places successfully",
      places: placeList,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

//@route GET v1/places/placeId
//@desc Get place
//@access public
//@role any
router.get("/:placeId", async (req, res) => {
  try {
    let placeList = [];
    let filterById = req.params.placeId;

    if (req.query.populate == "true") {
      //Get object foreign key
      placeList = await Place.findOne({
        _id: filterById,
        status: STATUS.PUBLIC,
      })
        .populate("province")
        .populate("category")
        .populate("tags")
        .exec();
    } else {
      placeList = await Place.find({ status: STATUS.PUBLIC, _id: filterById });
    }
    return res.status(200).json({
      success: true,
      message: "Get places successfully",
      place: placeList,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

//POST: Create new place
router.post("/", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    let start = req.body.startPrice;
    let end = req.body.endPrice;

    let place = new Place({
      name: req.body.name,
      description: req.body.description,
      longtitude: req.body.longtitude,
      lattitude: req.body.lattitude,
      tags: req.body.tags,
      rate: req.body.rate,
      rateVoting: req.body.rate,
      weight: req.body.weight,
      province: req.body.province,
      category: req.body.category,
      status: req.body.status,
      closeTime: req.body.closeTime,
      openTime: req.body.openTime,
      price: {
        start: start,
        end: end,
      },
      popular: res.body.popular,
    });
    try {
      place = await place.save();
      if (!place) {
        return res.status(500).json({
          success: false,
          message: "Create place unsuccessfully",
        });
      }

      //Update province placeCount;
      let province = await Province.findById(req.body.province);

      let updatedProvince = {
        placeCount: province.placeCount + 1,
        updatedAt: formatTimeUTC(),
      };
      updatedProvince = await Province.findOneAndUpdate(
        { _id: province._id },
        updatedProvince,
        { new: true }
      );

      Place.populate(place, ["category", "province"], function (err) {
        return res.status(200).json({
          success: true,
          message: "Create place successfully",
          place: place,
        });
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  })
);

//@route PUT v1/places/:placeId
//@desc update place info
//@access private
//@role admin
router.put("/:placeId", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      let start = req.body.startPrice;
      let end = req.body.endPrice;
      let states = "publicprivate";
      let status = states.includes(req.body.status)
        ? req.body.status
        : req.body.status.includes("true")
        ? STATUS.PUBLIC
        : STATUS.PRIVATE;
      const placeUpdate = await Place.findOneAndUpdate(
        {
          _id: req.params.placeId,
        },
        {
          name: req.body.name,
          description: req.body.description,
          longtitude: req.body.longtitude,
          lattitude: req.body.lattitude,
          address: req.body.address,
          tags: req.body.tags,
          rate: req.body.rate,
          weight: req.body.weight,
          province: req.body.province,
          category: req.body.category,
          status: status,
          closeTime: req.body.closeTime,
          openTime: req.body.openTime,
          price: {
            start: start,
            end: end,
          },
          reviewStatus: req.body.reviewStatus,
          viewCount: req.body.viewCount,
          updatedAt: formatTimeUTC(),
          popular: req.body.popular,
        },
        { new: true }
      );
      if (placeUpdate) {
        const resultUpdateVoting = await updateRateVoting(req.params.placeId);
        if (resultUpdateVoting) {
          Place.populate(
            resultUpdateVoting,
            ["category", "province", "tags"],
            function (err) {
              return res.status(200).json({
                message: "Update successful",
                success: true,
                place: resultUpdateVoting,
              });
            }
          );
        }
      }
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({
        message: "Internal server error",
        success: false,
      });
    }
  })
);
//@route DELETE v1/places
//@desc Delete places
//@access private
//@role admin
router.delete("/:placesId", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      await Place.findOneAndUpdate(
        { _id: req.params.placesId },
        {
          status: STATUS.PRIVATE,
          updatedAt: formatTimeUTC(),
        },
        { new: true },
        function (err, documents) {
          return res.status(200).json({
            message: "Delete place successfully",
            success: true,
            category: documents,
          });
        }
      );
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        success: false,
      });
    }
  })
);
//@route PUT v1/places/:placeId/images
//@desc Update images description in this place
//@access private
//@role admin
router.put("/:placeId/images", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      const placeUpdate = await Place.findOneAndUpdate(
        { _id: req.body.id },
        {
          images: req.body.images,
        },
        { new: true },
        function (err, documents) {
          if (err) {
            res.status(500).json({
              message: "Internal server error",
              success: false,
            });
          } else {
            res.status(200).json({
              message: "Update image success ",
              success: true,
              place: documents,
            });
          }
        }
      );
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        success: false,
      });
    }
  })
);

//TODO: Get popular place ( pick by admin )
//@route GET v1/places/popular/:number
//@desc Get popular place
//@access public
//@role any
router.get("/popular/topRating", async (req, res) => {
  try {
    let places = await Place.find({
      popular: true,
      status: STATUS.PUBLIC,
      rateVoting: { $gt: 3.5 },
      viewCount: { $gt: 15 },
    })
      .populate("province")
      .populate("category")
      .populate("tags")
      .exec();

    places = places.sort((a, b) => b.rateVoting - a.rateVoting);

    res.json({ success: true, message: "Get place successfully", places });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});
//TODO: Get best rating
router.get("/best-rating/top", async (req, res) => {
  try {
    let places = await Place.find({ rateVoting: { $gt: 4 } })
      .populate("province")
      .populate("category")
      .populate("tags")
      .exec();

    places = places.sort((a, b) => b.reviewCount - a.reviewCount);
    res.json({ success: true, message: "Get place successfully", places });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});
//TODO: Get the top 10 hot search place
//@route PUT v1/places/category/:categoryId
//@desc Update images description in this place
//@access public
//@role any
router.get("/top-search/:number", async (req, res) => {
  try {
    let places = await Place.find({ viewCount: { $gt: 10 } })
      .populate("province")
      .populate("category")
      .populate("tags")
      .exec();

    places = places
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, req.params.number + 1);
    res.json({ success: true, message: "Get place successfully", places });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});
//TODO: Get place by category id
//@route PUT v1/places/category/:categoryId
//@desc Update images description in this place
//@access public
//@role any
router.get("/category/:categoryId", async (req, res) => {
  try {
    let places = await Place.find({
      category: req.params.categoryId,
      status: STATUS.PUBLIC,
    })
      .populate("province")
      .populate("category")
      .populate("tags")
      .exec();
    //Sort with rating
    places = places.sort((a, b) => b.rateVoting - a.rateVoting);
    res.json({ success: true, message: "Get place successfully", places });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});

//TODO: Get place by tags

router.put("/find/tags", async (req, res, next) => {
  try {
    let tagsRequest = req.body.tags;

    let places = await Place.find({
      tags: {
        $elemMatch: { $in: tagsRequest },
      },
      status: STATUS.PUBLIC,
    })
      .populate("province")
      .populate("category")
      .populate("tags")
      .exec();

    //Sort with rating
    places = places.sort((a, b) => b.rateVoting - a.rateVoting);
    res.json({ success: true, message: "Get place successfully", places });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

//TODO: Get place of a province by province ID
router.get("/province/:provinceId", async (req, res) => {
  try {
    let places = await Place.find({
      province: req.params.provinceId,
      status: STATUS.PUBLIC,
    })
      .populate("province")
      .populate("category")
      .populate("tags")
      .exec();
    //Sort with rating
    places = places.sort((a, b) => b.rateVoting - a.rateVoting);
    res.json({ success: true, message: "Get place successfully", places });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});
//TODO: Get nearby places by place ID

router.get("/nearBy/:provinceId/:placeId", async (req, res) => {
  try {
    let places = await Place.find({
      province: req.params.provinceId,
      status: STATUS.PUBLIC,
    })
      .populate("province")
      .populate("category")
      .populate("tags")
      .exec();
    let place = places.find((place) => place.id === req.params.placeId);
    places = places.filter((place) => place.id !== req.params.placeId);
    //Sort with distance

    if (places)
      places = places.sort(
        (a, b) =>
          Math.abs(place.lattitude - a.lattitude) +
          Math.abs(place.longtitude - a.longtitude) -
          (Math.abs(place.lattitude - b.lattitude) +
            Math.abs(place.longtitude - b.longtitude))
      );
    res.json({ success: true, message: "Get place successfully", places });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});

const handleSearch = (keyWord, items) => {
  if (keyWord === "") {
    //TODO: handel search for capital word
    return items;
  } else
    return [
      ...items.filter((x) =>
        x.name
          .toLowerCase()
          .normalize("NFC")
          .replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, "")
          .includes(
            keyWord
              .toLowerCase()
              .normalize("NFC")
              .replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, "")
          )
      ),
    ];
};
//@route POST v1/places/suggestion/:text
//@desc Get places contain text in name
//@access public
//@role any
router.post("/suggestion", async (req, res) => {
  try {
    let places = await Place.find({
      status: STATUS.PUBLIC,
    })
      .populate("province")
      .populate("category")
      .populate("tags")
      .exec();
    //Sort with rating
    console.log(req.body.text);
    places = await handleSearch(req.body.text, places);
    places = places.sort((a, b) => b.rateVoting - a.rateVoting);
    res.json({ success: true, message: "Get place successfully", places });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});

//@route POST v1/places/viewCount/:placeId
//@desc PUT update viewCount
//@access public
//@role any
router.put("/viewCount/:placeId", async (req, res) => {
  try {
    let place = await Place.findById(req.params.placeId);
    if (!place) {
      return res.status(404).json({
        message: "Place not found ",
      });
    }

    place = await Place.findByIdAndUpdate(
      req.params.placeId,
      { viewCount: place.viewCount + 1 },
      { new: true }
    )
      .populate("province")
      .populate("category")
      .populate("tags")
      .exec();

    //Sort with rating
    res.json({
      success: true,
      message: "Update view count successfully",
      place,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;
