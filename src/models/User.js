const mongoose = require("mongoose");
const { formatTimeUTC } = require("../utils/Timezone");

const userSchema = mongoose.Schema({
  fullName: {
    type: String,
    require: true,
    min: 1,
  },
  email: {
    type: String,
    require: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
  },
  favorite: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "places",
    },
  ],
  isUser: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: formatTimeUTC,
  },
  updatedAt: {
    type: Date,
    default: formatTimeUTC,
  },
  image:{
    type:String,
    default:"https://hinhnen123.com/wp-content/uploads/2021/06/avt-cute-9.jpg"
  }
});

userSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});
module.exports = mongoose.model("users", userSchema);
