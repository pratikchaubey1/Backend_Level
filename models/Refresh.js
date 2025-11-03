const mongoose = require('mongoose')

const refreshSchema = new mongoose.Schema({
    token:{
        type:String,
        required:true,
        unique:true,
    },
    User:{
        type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
    },
    ExpireAt:{
        type:Date,
        required:true,

    }

})
refreshSchema.index({expiresAt:1}, {expiryAfterSecond : 0})
const Refresh = mongoose.model("Refresh" , refreshSchema)

module.exports = Refresh