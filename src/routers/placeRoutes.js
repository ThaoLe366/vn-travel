const Place = require("../models/Place");
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const { formatTimeUTC } = require("../utils/Timezone");
const { STATUS } = require("../models/enum");

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
      }).populate("province").populate('category').populate('tags').exec();
    } else {
      placeList = await Place.find({ isHidden: false });
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
      placeList = await Place.find({
        status: STATUS.PUBLIC,
        _id: filterById,
      }).populate("province").populate('category').exec();
    } else {
      placeList = await Place.find({ isHidden: false, _id: filterById });
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
    let end=req.body.endPrice;

    let place = new Place({
      name: req.body.name,
      description: req.body.description,
      longtitude: req.body.longtitude,
      lattitude: req.body.lattitude,
      tags: req.body.tags,
      rate: req.body.rate,
      weight: req.body.weight,
      province: req.body.province,
      category:req.body.category,
      status: req.body.status,
      closeTime: req.body.closeTime,
      openTime: req.body.openTime,
      price: {
        start:start,
        end:end
      }
    });
    try {
      place = await place.save();
      if (!place) {
        return res.status(500).json({
          success: false,
          message: "Create place unsuccessfully",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Create place successfully",
        place: place,
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
      console.log(req.body)
      let start = req.body.startPrice;
      let end=req.body.endPrice;
      
      const placeUpdate = await Place.findOneAndUpdate(
        {
          _id: req.params.placeId,
        },
        {
          name: req.body.name,
          description: req.body.description,
          longtitude: req.body.longtitude,
          lattitude: req.body.lattitude,
          address:req.body.address,
          tags: req.body.tags,
          rate: req.body.rate,
          weight: req.body.weight,
          province: req.body.province,
          category:req.body.category,
          status: req.body.status,
          closeTime: req.body.closeTime,
          openTime: req.body.openTime,
          price: {
            start:start,
            end:end
          },
          updatedAt: formatTimeUTC(),
        },
        { new: true },
        function (err, documents) {
          return res.status(200).json({
            message: "Update successfully",
            success: true,
            place: documents,
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
router.put("/:placeId/images", requireAuth, async(req,res,next)=> requireRole("admin", req,res,next, async(req,res,next)=>{
  try {
    console.log(req.body.images)
    const placeUpdate = await Place.findOneAndUpdate({_id:req.body.id},{
      images: req.body.images
    },
    { new: true }, function(err, documents){
      if(err){
         res.status(500).json({
                    message: "Internal server error",
                    success: false,
                  });
      }
      else{
         res.status(200).json({
                    message: "Update image success ",
                    success: true,
                    place: documents ,
                  });
      }
    })
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
}))

//@route PUT v1/places/:placeId/images
//@desc Add image to place
//@access private
//@role 

module.exports = router;
