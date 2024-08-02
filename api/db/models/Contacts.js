const mongoose = require("mongoose");

const schema = mongoose.Schema({
    cit_number: {type: Number}, //tc kimlik no ya da benzersiz tanımlayıcı
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    birth_place: {type: String},
    birth_day: {type: String},
    gender: {type: String, required: true},
    mname: {type: String},
    fname: {type: String},
    blood_group: {type: String},
    education: {type: String},
    marital_status: {type: String, required: true},
    dwelling_id:{type: mongoose.SchemaTypes.ObjectId}, //adres konut bağlantısı
    phone_number: {type: String},
    gsm: {type: String, required: true},
    address: {type: String},
    city:{type: String},
    province:{type: String},
    email: {type: String},
    web_page: {type: String},
    is_active: { type: Boolean, default: true },
    image: { type: String, required: false }, 
    tags: { type: [String], required: false }, 
    description: { type: String, required: false }, 
    created_by: { type: mongoose.SchemaTypes.ObjectId },
    deleted_at: { type: Date, default: null }, // Silinme tarihi
}, {
    versionKey: false,
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});

class Contacts extends mongoose.Model {

}

schema.loadClass(Contacts);
module.exports = mongoose.model("contacts", schema);