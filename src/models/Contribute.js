const mongoose = require('mongoose')
const { formatTimeUTC } = require("../utils/Timezone");

const contributeSchema = mongoose.Schema({
    content: {
        type: String
    },
    place: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'places'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    createdAt: {
        type: Date,
        default: formatTimeUTC
    },
    updatedAt: {
        type: Date,
        default: formatTimeUTC
    },
    isSeen: {
        type: Boolean,
        default: false
    },
    isHidden: {
        type: Boolean,
        default: false
    }
})

contributeSchema.method("toJSON", function () {
    const { __v, ...object } = this.toObject();
    const { _id: id, ...result } = object;
    return { ...result, id };
});

module.exports = mongoose.model('contributes', contributeSchema)
