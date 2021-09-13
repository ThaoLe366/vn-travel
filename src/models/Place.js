const mongoose = require("mongoose");
const { formatTimeUTC } = require("../utils/Timezone");
const { STATUS } = require("./enum");

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
    type: mongoose.Schema.Types.Decimal128,
  },
  lattitude: {
    type: mongoose.Schema.Types.Decimal128,
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
});

placeSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});
module.exports = mongoose.model("places", placeSchema);
