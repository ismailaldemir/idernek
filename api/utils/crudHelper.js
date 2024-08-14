const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const fs = require("fs");
const path = require("path");
const config = require("../config");
const { v4: uuidv4 } = require("uuid");
const AuditLog = require("../db/models/AuditLogs");
const { createAuditLog } = require("../utils/auditLogHelper");

const createSlug = name => {
  return name.toLowerCase().replace(/ /g, "-") + "-" + uuidv4(); // Kategori adını slug'a çevir ve uuid ekle
};

// Dinamik olarak entityFields.js dosyasını yükleme
async function loadEntityFields() {
  //const entityFields = await import('../../frontend/src/constants/entityFields.js');
  const entityFields = await import('../../shared/entityFields.js');
  console.log("Loaded Entity Fields:", entityFields.default || entityFields); 
  return entityFields.default; // Eğer `export default` kullanıldıysa.
}

// Entity alanlarını dinamik olarak hazırlayan fonksiyon
async function prepareEntityValues(collectionName, body) {
  console.log("Collection Name:", collectionName);
  const entityFields = await loadEntityFields();
  console.log("Fields for All Collections:", entityFields); 
  const fields = entityFields[collectionName];
  console.log("Fields for Specific Collection:", fields);
  if (!fields) {
    throw new CustomError(
      Enum.HTTP_CODES.BAD_REQUEST,
      "Invalid collection name." //TODO: Çeviri eklenecek
    );
  }

  const preparedValues = {};
  for (const key of Object.keys(fields)) {
    if (body[key] !== undefined) {
      preparedValues[key] = body[key];
    }
  }
  console.log("Prepared Values:", preparedValues);
  return preparedValues;
}

// const createEntity = async (Model, body, file, user, req) => {
//   try {
//     if (!body || typeof body !== "object") {
//       throw new CustomError(
//         Enum.HTTP_CODES.BAD_REQUEST,
//         "Request body is missing or invalid."
//       );
//     }

//     if (!body.name) {
//       throw new CustomError(
//         Enum.HTTP_CODES.BAD_REQUEST,
//         "Name is required." //TODO:Çeviri eklenecek
//       );
//     }

//     const existingCategory = await Model.findOne({ name: body.name });
//     if (existingCategory) {
//       throw new CustomError(
//         Enum.HTTP_CODES.CONFLICT,
//         "Record already exists."
//       );
//     }

//     // Slug oluşturma
//     const slug = createSlug(body.name); // Kategori adı ile slug oluştur

//     const newEntity = new Model({
//       lang:body.lang,
//       name: body.name,
//       slug: slug,
//       is_active: body.is_active,
//       created_by: user.id,
//       image: file ? file.filename : undefined,
//       tags: body.tags ? JSON.parse(body.tags) : [],
//       description: body.description || "",
//       parent_id: body.parent_id || null
//     });

//     await newEntity.save();

//     // Kullanıcı bilgilerini alma
//     const ip_address =
//       req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

//     // Audit log kaydı oluşturma
//     const auditLog = new AuditLog({
//       user_id: user.id,
//       action: "create",
//       entity: Model.collection.collectionName,
//       entity_id: newEntity._id,
//       old_value: null,
//       new_value: newEntity,
//       ip_address: ip_address,
//       device: req.useragent.platform, // Middleware'den gelen platform bilgisi
//       os: req.useragent.os, // İşletim sistemi bilgisi
//       browser: req.useragent.browser, // Tarayıcı bilgisi
//       is_mobile: req.useragent.isMobile // Mobil olup olmadığını gösterir
//     });

//     // Audit log kaydetme
//     try {
//       await auditLog.save();
//     } catch (auditError) {
//       console.error("Audit log kaydedilemedi:", auditError);
//     }

//     return Response.successResponse(newEntity);
//   } catch (error) {
//     throw error;
//   }
// };

const createEntity = async (Model, body, file, user, req) => {
  try {
    if (!body || typeof body !== "object") {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Request body is missing or invalid."
      );
    }

    // Body içindeki alanları dinamik olarak hazırla
    const preparedBody = await prepareEntityValues(Model.collection.collectionName, body);

    const newEntity = new Model({
      ...preparedBody,
      created_by: user.id,
      image: file ? file.filename : undefined,
      tags: preparedBody.tags ? JSON.parse(preparedBody.tags) : [],
    });

    await newEntity.save();

    // Kullanıcı bilgilerini alma
    const ip_address =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Audit log kaydı oluşturma
    const auditLog = new AuditLog({
      user_id: user.id,
      action: "create",
      entity: Model.collection.collectionName,
      entity_id: newEntity._id,
      old_value: null,
      new_value: newEntity,
      ip_address: ip_address,
      device: req.useragent.platform, // Middleware'den gelen platform bilgisi
      os: req.useragent.os, // İşletim sistemi bilgisi
      browser: req.useragent.browser, // Tarayıcı bilgisi
      is_mobile: req.useragent.isMobile // Mobil olup olmadığını gösterir
    });

    // Audit log kaydetme
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

const updateEntity = async (Model, id, body, file, user, req) => {
  try {
    const entity = await Model.findById(id);
    if (!entity) {
      throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, "Entity not found.");
    }

    // Eski değeri kaydet
    const oldValue = {
      lang:entity.lang,
      name: entity.name,
      is_active: entity.is_active,
      tags: entity.tags,
      description: entity.description,
      parent_id: entity.parent_id,
      image: entity.image
    };

    // Güncelleme işlemleri
    entity.name = body.name || entity.name;
    entity.lang = body.lang || entity.lang;
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
    await createAuditLog({
      user,
      action: "update",
      entity: Model.collection.collectionName,
      entityId: entity._id,
      oldValue, // Eski değer
      newValue: entity, // Yeni değer
      userAgentInfo: req.userAgentInfo // User agent bilgileri
    });

    return Response.successResponse(entity);
  } catch (error) {
    throw error;
  }
};

const deleteEntities = async (Model, ids, user, req, fileDelete = true) => {
  try {
    const entitiesToDelete = await Model.find({ _id: { $in: ids } });

    if (entitiesToDelete.length === 0) {
      throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, "No entities found.");
    }

    // Silinecek kayıtların eski değerlerini kaydet
    const oldValues = entitiesToDelete.map(entity => ({
      _id: entity._id,
      lang:entity.lang,
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
    for (const entity of entitiesToDelete) {
      await createAuditLog({
        user,
        action: "delete",
        entity: Model.collection.collectionName,
        entityId: entity._id,
        oldValue: entity, // Eski değer
        newValue: null, // Kalıcı silme sonrası değer yok
        userAgentInfo: req.userAgentInfo // User agent bilgileri
      });
    }

    return Response.successResponse({ success: true });
  } catch (error) {
    throw error;
  }
};

const softDeleteEntities = async (Model, ids, user, req) => {
  try {
    await Model.updateMany(
      { _id: { $in: ids } },
      { $set: { deleted_at: new Date() } }
    );

    // Audit log kaydı oluştur
    for (const id of ids) {
      await createAuditLog({
        user,
        action: "soft_delete",
        entity: Model.collection.collectionName,
        entityId: id,
        oldValue: { deleted_at: null }, // Soft delete öncesi değer
        newValue: { deleted_at: new Date() }, // Soft delete sonrası değer
        userAgentInfo: req.userAgentInfo // User agent bilgileri
      });
    }

    return Response.successResponse({ success: true });
  } catch (error) {
    throw error;
  }
};

const restoreEntities = async (Model, ids, user, req) => {
  try {
    await Model.updateMany(
      { _id: { $in: ids } },
      { $set: { deleted_at: null } }
    );

    // Audit log kaydı oluştur
    for (const id of ids) {
      await createAuditLog({
        user,
        action: "restore",
        entity: Model.collection.collectionName,
        entityId: id,
        oldValue: { deleted_at: new Date() }, // Geri yüklemeden önceki değer
        newValue: { deleted_at: null }, // Geri yüklemeden sonraki değer
        userAgentInfo: req.userAgentInfo // User agent bilgileri
      });
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
