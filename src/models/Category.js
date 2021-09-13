const mongoose = require('mongoose');
const { formatTimeUTC } = require('../utils/Timezone');

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    color: {
        type: String,
        default: '#FFF'
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: formatTimeUTC
    },
    updatedAt: {
        type: Date,
        default: formatTimeUTC
    },
})

categorySchema.method("toJSON", function () {
    const { __v, ...object } = this.toObject();
    const { _id: id, ...result } = object;
    return { ...result, id };
});
exports.Category = mongoose.model("categories", categorySchema);