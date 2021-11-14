const mongoose = require("mongoose");
const currentTime = Date.now();
const { formatTimeUTC } = require("../utils/Timezone");

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  start: {
    type: Date,
    default: currentTime,
  },
  end: {
    type: Date,
    default: currentTime,
  },
  note: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: formatTimeUTC,
  },
  updatedAt: {
    type: Date,
    default: formatTimeUTC,
  },
  photoUrl: {
    type: String,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "users",
  },
  sections: [
    {
      type: mongoose.Types.ObjectId,
      ref: "sections",
    },
  ],
});

planSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});

module.exports = mongoose.model("plans", planSchema);
