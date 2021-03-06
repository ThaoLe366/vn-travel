const mongoose = require('mongoose');
const { formatTimeUTC } = require('../utils/Timezone');

const provinceSchema = mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    color: {
        type: String,
        default: '#fff'
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

provinceSchema.method("toJSON", function () {
    const { __v, ...object } = this.toObject();
    const { _id: id, ...result } = object;
    return { ...result, id };
});
exports.Province = mongoose.model("provinces", provinceSchema);