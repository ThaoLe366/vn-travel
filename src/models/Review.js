const mongoose = require("mongoose");
const { formatTimeUTC } = require("../utils/Timezone");

const reviewSchema = mongoose.Schema({
    title: {
        type: String,
        require: true
    },
    content: {
        type: String,
        require: true
    },
    rate: {
        type: mongoose.Schema.Types.Decimal128,
        require: true,
        default: 0
    },
    likeCount: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0
    },
    likedUser: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: []
    }],
    createAt: {
        type: Date,
        default: formatTimeUTC
    },
    visitedTime: {
        type: Date,
        require: true
    },

    updatedAt: {
        type: Date,
        default: formatTimeUTC
    },
    place: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'places',
        require: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        require: true
    },
    isHidden: {
        type: Boolean,
        default: false
    }
})

reviewSchema.method("toJSON", function () {
    const { __v, ...object } = this.toObject();
    const { _id: id, ...result } = object;
    return { ...result, id };
});
module.exports = mongoose.model('reviews', reviewSchema)

