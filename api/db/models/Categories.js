const mongoose = require("mongoose");
const Users = require("./Users");

const schema = mongoose.Schema(
  {
    name: { type: String, required: true },
    is_active: { type: Boolean, default: true }, //Durum belirlemesi için eklendi
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Users, // Referans olarak "users" modeli eklendi
      required: false
    },
    image: { type: String, required: false }, // Resim dosyasının yolunu depolamak için eklendi
    tags: { type: [String], required: false }, // Birden fazla tag bilgisi için eklendi
    description: { type: String, required: false }, // Biçimlendirilmiş veri için eklendi
    deleted_at: { type: Date, default: null }, // Silinme tarihi
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

class Categories extends mongoose.Model {}

schema.loadClass(Categories);
module.exports = mongoose.model("categories", schema);
