const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const router = express.Router();
const { Category } = require("../models/Category");
const { formatTimeUTC } = require("../utils/Timezone");

//@route GET v1/categories
//@desc Get all categories
//@access public
//@role any
router.get("/", async (req, res) => {
  try {
    const categoryList = await Category.find();
    return res.status(200).json({
      message: "Get all category successfully",
      success: true,
      categories: categoryList,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
});

//@desc Get all public categories
//@access public
//@role any
router.get("/public", async (req, res) => {
  try {
    const categoryList = await Category.find({ isHidden: false });
    return res.status(200).json({
      message: "Get all category successfully",
      success: true,
      categories: categoryList,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
});

//@route POST v1/categorys
//@desc Create new category
//@access private
//@role admin
router.post("/", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      let category = new Category({
        name: req.body.name,
        color: req.body.color,
        isHidden: req.body.isHidden,
      });

      category = await category.save();
      return res.status(200).json({
        message: "Create category successfully",
        success: true,
        category: category,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message,
        success: false,
      });
    }
  })
);

//@route PUT v1/categorys/:categoryId
//@desc Update category info
//@access private
//@role admin
router.put("/:categoryId", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      const categoryUpdate = await Category.findOneAndUpdate(
        { _id: req.params.categoryId },
        {
          name: req.body.name,
          color: req.body.color,
          isHidden: req.body.isHidden,
          updatedAt: formatTimeUTC(),
        },
        { new: true },
        function (err, documents) {
          return res.status(200).json({
            message: "Update successfully",
            success: true,
            category: documents,
          });
        }
      );
    } catch (error) {
      return res.status(500).json({
        message: error.message,
        success: false,
      });
    }
  })
);
//@route DELETE v1/categories
//@desc Delete categories
//@access private
//@role admin
router.delete("/:categoryId", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      await Category.findOneAndUpdate(
        { _id: req.params.categoryId },
        {
          isHidden: true,
          updatedAt: formatTimeUTC(),
        },
        { new: true },
        function (err, documents) {
          return res.status(200).json({
            message: "Delete province successfully",
            success: true,
            category: documents,
          });
        }
      );
    } catch (error) {
      return res.status(500).json({
        message: error.message,
        success: false,
      });
    }
  })
);

module.exports = router;
