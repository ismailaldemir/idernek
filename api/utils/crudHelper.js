const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const fs = require("fs");
const path = require("path");
const config = require("../config");
const { v4: uuidv4 } = require("uuid");

const createSlug = (name) => {
  return name.toLowerCase().replace(/ /g, '-') + '-' + uuidv4(); // Kategori adını slug'a çevir ve uuid ekle
};

const createEntity = async (Model, body, file, user) => {
  try {
    if (!body.name) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18next.t("Category name is required."));
    }

    const existingCategory = await Model.findOne({ name: body.name });
    if (existingCategory) {
      throw new CustomError(Enum.HTTP_CODES.CONFLICT, i18next.t("Category already exists."));
    }

    // Slug oluşturma
    const slug = createSlug(body.name); // Kategori adı ile slug oluştur

    const newEntity = new Model({
      name: body.name,
      slug: slug,
      is_active: body.is_active,
      created_by: user._id,
      image: file ? file.filename : undefined,
      tags: body.tags ? JSON.parse(body.tags) : [],
      description: body.description || "",
      parent_id: body.parent_id || null
    });

    await newEntity.save();
    return Response.successResponse(newEntity);
  } catch (error) {
    throw error;
  }
};

const updateEntity = async (Model, id, body, file) => {
  try {
    const entity = await Model.findById(id);
    if (!entity) {
      throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, i18next.t("Entity not found."));
    }

    entity.name = body.name || entity.name;
    entity.is_active =
      body.is_active !== undefined ? body.is_active : entity.is_active;
    entity.tags = body.tags ? JSON.parse(body.tags) : entity.tags;
    entity.description =
      body.description !== undefined ? body.description : entity.description;

    if (body.parent_id && body.parent_id !== "-1") {
      entity.parent_id = body.parent_id;
    } else {
      entity.parent_id = null;
    }

    if (file) {
      if (entity.image) {
        const oldImagePath = path.join(config.FILE_UPLOAD_PATH, entity.image);
        if (fs.existsSync(oldImagePath)) {
          await fs.promises.unlink(oldImagePath);
        }
      }
      entity.image = file.filename;
    }

    await entity.save();
    return Response.successResponse(entity);
  } catch (error) {
    throw error;
  }
};

const deleteEntities = async (Model, ids, fileDelete = true) => {
  try {
    const entitiesToDelete = await Model.find({ _id: { $in: ids } });

    await Model.deleteMany({ _id: { $in: ids } });

    if (fileDelete) {
      for (const entity of entitiesToDelete) {
        if (entity.image) {
          const filePath = path.join(config.FILE_UPLOAD_PATH, entity.image);
          if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
          }
        }
      }
    }

    return Response.successResponse({ success: true });
  } catch (error) {
    throw error;
  }
};

const softDeleteEntities = async (Model, ids) => {
  try {
    await Model.updateMany(
      { _id: { $in: ids } },
      { $set: { deleted_at: new Date() } }
    );
    return Response.successResponse({ success: true });
  } catch (error) {
    throw error;
  }
};

const restoreEntities = async (Model, ids) => {
  try {
    await Model.updateMany(
      { _id: { $in: ids } },
      { $set: { deleted_at: null } }
    );
    return Response.successResponse({ success: true });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createEntity,
  updateEntity,
  deleteEntities,
  softDeleteEntities,
  restoreEntities
};
