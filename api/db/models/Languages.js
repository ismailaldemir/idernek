const mongoose = require("mongoose");
const Users = require("./Users");

const schema = mongoose.Schema(
  {
    lang: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    is_active: { type: Boolean, default: true }, //Durum belirlemesi için eklendi
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Users, // Referans olarak "users" modeli eklendi
      required: false //sadece yeni kayıt eklemede kullanılacağı için zorunlu alan olamaz
    },
    image: { type: String, required: false },
    tags: { type: [String], required: true },
    description: { type: String, required: false },
    deleted_at: { type: Date, default: null } // Silinme tarihi
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

class Languages extends mongoose.Model {}

schema.loadClass(Languages);
module.exports = mongoose.model("languages", schema);
