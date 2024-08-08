const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const fs = require("fs");
const path = require("path");
const config = require("../config");
const { v4: uuidv4 } = require("uuid");
const AuditLog = require("../db/models/AuditLogs");

const createSlug = name => {
  return name.toLowerCase().replace(/ /g, "-") + "-" + uuidv4(); // Kategori adını slug'a çevir ve uuid ekle
};

const createEntity = async (Model, body, file, user) => {
  try {
    if (!body.name) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Category name is required."
      );
    }

    const existingCategory = await Model.findOne({ name: body.name });
    if (existingCategory) {
      throw new CustomError(
        Enum.HTTP_CODES.CONFLICT,
        "Category already exists."
      );
    }

    // Slug oluşturma
    const slug = createSlug(body.name); // Kategori adı ile slug oluştur

    const newEntity = new Model({
      name: body.name,
      slug: slug,
      is_active: body.is_active,
      created_by: user.id,
      image: file ? file.filename : undefined,
      tags: body.tags ? JSON.parse(body.tags) : [],
      description: body.description || "",
      parent_id: body.parent_id || null
    });

    await newEntity.save();

    // Audit log kaydı oluştur
    const auditLog = new AuditLog({
      user_id: user.id,
      action: "create", // 'create' olarak güncellendi
      entity: Model.collection.collectionName,
      entity_id: newEntity._id, // Doğru şekilde yeni kaydın ID'sini kullan
      old_value: null, // Yeni oluşturulmuş bir kayıt için eski değer yok
      new_value: newEntity // Yeni değer
    });

    try {
      await auditLog.save();
    } catch (auditError) {
      console.error("Audit log kaydedilemedi:", auditError);
    }

    return Response.successResponse(newEntity);
  } catch (error) {
    throw error;
  }
};

const updateEntity = async (Model, id, body, file, user) => {
  try {
    const entity = await Model.findById(id);
    if (!entity) {
      throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, "Entity not found.");
    }

    // Eski değeri kaydet
    const oldValue = {
      name: entity.name,
      is_active: entity.is_active,
      tags: entity.tags,
      description: entity.description,
      parent_id: entity.parent_id,
      image: entity.image
    };

    // Güncelleme işlemleri
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

    // Audit log kaydı oluştur
    const auditLog = new AuditLog({
      user_id: user.id, // Kullanıcının ID'sini al
      action: "update", // Güncelleme işlemi
      entity: Model.collection.collectionName,
      entity_id: entity._id,
      old_value: oldValue, // Eski değer
      new_value: entity // Yeni değer
    });

    await auditLog.save();

    return Response.successResponse(entity);
  } catch (error) {
    throw error;
  }
};

const deleteEntities = async (Model, ids, user, fileDelete = true) => {
  try {
    const entitiesToDelete = await Model.find({ _id: { $in: ids } });

    if (entitiesToDelete.length === 0) {
      throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, "No entities found.");
    }

    // Silinecek kayıtların eski değerlerini kaydet
    const oldValues = entitiesToDelete.map(entity => ({
      _id: entity._id,
      name: entity.name,
      is_active: entity.is_active,
      tags: entity.tags,
      description: entity.description,
      parent_id: entity.parent_id,
      image: entity.image
    }));

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

    // Audit log kaydı oluştur
    for (const id of ids) {
      const auditLog = new AuditLog({
        user_id: user.id,
        action: "delete", // Kalıcı silme işlemi
        entity: Model.collection.collectionName,
        entity_id: id, // Her bir silinen kaydın ID'si
        old_value: entitiesToDelete.find(entity => entity._id.equals(id)), // Eski değer
        new_value: null // Kalıcı silme sonrası değer yok
      });

      await auditLog.save();
    }

    return Response.successResponse({ success: true });
  } catch (error) {
    throw error;
  }
};

const softDeleteEntities = async (Model, ids, user) => {
  try {
    await Model.updateMany(
      { _id: { $in: ids } },
      { $set: { deleted_at: new Date() } }
    );

    // Audit log kaydı oluştur
    for (const id of ids) {
      const auditLog = new AuditLog({
        user_id: user.id,
        action: "soft_delete", // Soft delete işlemi
        entity: Model.collection.collectionName,
        entity_id: id, // Her bir silinen kaydın ID'si
        old_value: { deleted_at: null }, // Soft delete öncesi değer
        new_value: { deleted_at: new Date() } // Soft delete sonrası değer
      });

      await auditLog.save();
    }

    return Response.successResponse({ success: true });
  } catch (error) {
    throw error;
  }
};

const restoreEntities = async (Model, ids, user) => {
  try {
    await Model.updateMany(
      { _id: { $in: ids } },
      { $set: { deleted_at: null } }
    );

    // Audit log kaydı oluştur
    for (const id of ids) {
      const auditLog = new AuditLog({
        user_id: user.id,
        action: "restore", // Geri yükleme işlemi
        entity: Model.collection.collectionName,
        entity_id: id, // Her bir geri yüklenen kaydın ID'si
        old_value: { deleted_at: new Date() }, // Geri yüklemeden önceki değer
        new_value: { deleted_at: null } // Geri yüklemeden sonraki değer
      });

      await auditLog.save();
    }

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
