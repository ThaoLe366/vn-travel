const mongoose = require("mongoose");
const { formatTimeUTC } = require("../utils/Timezone");
const { STATUS } = require("./enum");
const Double = require("mongodb").Double;
const placeSchema = mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    default: "",
  },
  longtitude: {
    type: Number,
    default: 0,
  },
  lattitude: {
    type: Number,
    default: 0,
  },
  address: {
    type: String,
  },
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tags",
    },
  ],
  rate: {
    type: Number,
    require: true,
    default: 0,
  },
  rateVoting: { type: Number, require: true },
  reviewCount: {
    type: Number,
    default: 0,
  },
  weight: {
    type: Number,
    default: 10,
  },
  province: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "provinces",
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "categories" },
  status: {
    type: String,
    default: STATUS.PUBLIC,
  },
  closeTime: String,
  openTime: String,
  price: {
    start: {
      type: Number,
      default: 0,
    },
    end: {
      type: Number,
      default: 0,
    },
  },
  images: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: formatTimeUTC,
  },
  updatedAt: {
    type: Date,
    default: formatTimeUTC,
  },
  //!ADD NEW FIELDS
  viewCount: {
    type: Number,
    default: 0,
  },
  reviewStatus: {
    excellent: {
      type: Number,
      default: 0,
    },
    good: {
      type: Number,
      default: 0,
    },
    average: {
      type: Number,
      default: 0,
    },
    poor: {
      type: Number,
      default: 0,
    },
    terrible: {
      type: Number,
      default: 0,
    },
  },
});

placeSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});
module.exports = mongoose.model("places", placeSchema);
