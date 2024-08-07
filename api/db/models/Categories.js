const mongoose = require("mongoose");
const Users = require("./Users");

const schema = mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories", // Referans olarak "categories" modeli eklendi
      required: false
    },
    is_active: { type: Boolean, default: true }, //Durum belirlemesi için eklendi
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Users, // Referans olarak "users" modeli eklendi
      required: false
    },
    image: { type: String, required: false },
    tags: { type: [String], required: false },
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

class Categories extends mongoose.Model {}

schema.loadClass(Categories);
module.exports = mongoose.model("categories", schema);
