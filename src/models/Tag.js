const mongoose = require("mongoose");
const  {formatTimeUTC}  = require("../utils/Timezone");

const tagSchema = mongoose.Schema({
  name: {
    type: String,
    require: true,
    default: "",
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: formatTimeUTC,
  },
  updatedAt: {
    type: Date,
    default: formatTimeUTC,
  },
});

tagSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});
exports.Tag = mongoose.model("tags", tagSchema);
