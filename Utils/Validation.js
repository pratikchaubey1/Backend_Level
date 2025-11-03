const joi = require('joi')

const Validation = (data) =>{
    const Schema = joi.object({
        username:joi.string().min(3).max(20).required(),
        email:joi.string().email().required(),
        password:joi.string().min(6).required()
    })
    return Schema.validate(data)
}
module.exports = Validation
