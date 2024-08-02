const mongoose = require("mongoose");
const Associations = require("./Associations");
const Persons = require("./Contacts");
const Constants = require("./Constants");

const schema = mongoose.Schema({
    association_id: { type: mongoose.SchemaTypes.ObjectId, required: true, ref: Associations },//üye olunan dernek
    memtype_id: { type: mongoose.SchemaTypes.ObjectId, required: true, ref: Constants },//üyeliğin türü sabitler (constants) tablosundan alınacak 
    person_id: { type: mongoose.SchemaTypes.ObjectId, required: true, ref: Persons },//üyeye ait kimlik bilgileri kişiler (persones) tablosundan alınacak
    dec_date: { type: Date, required: true},//decission date karar tarihi
    dec_number: { type: String, required: true},//decission number karar numarası
    member_number: { type: String, required: true},//üye numarası
    entry_date: { type: Date, required: true},//üyelik başlangıç tarihi
    term_date: { type: Date},//termination date üyelik sonlandırma tarihi
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.SchemaTypes.ObjectId }
}, {
    versionKey: false,
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});

class Members extends mongoose.Model {

}

schema.loadClass(Members);
module.exports = mongoose.model("members", schema);