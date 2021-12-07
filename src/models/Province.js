const mongoose = require("mongoose");
const { formatTimeUTC } = require("../utils/Timezone");

const provinceSchema = mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  color: {
    type: String,
    default: "#fff",
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
  //!ADD NEW FIELDS
  image: {
    type: String,
    require: true,
    default:
      "https://www.travelanddestinations.com/wp-content/uploads/2017/08/Tran-Quoc-Pagoda-Hanoi-blue-hour.jpg",
  },
  placeCount: {
    type: Number,
    default: 0,
  },
});

// provinceSchema.method("toJSON", function () {
//   const { __v, ...object } = this.toObject();
//   const { _id: id, ...result } = object;
//   return { ...result, id };
// });
provinceSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  },
});
exports.Province = mongoose.model("provinces", provinceSchema);
