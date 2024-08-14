const express = require("express");
const router = express.Router();
const Languages = require("../db/models/Languages");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const AuditLogs = require("../lib/AuditLogs");
const logger = require("../lib/logger/LoggerClass");
const config = require("../config");
const auth = require("../lib/auth")();
const i18n = require("../i18n");
const emitter = require("../lib/Emitter");
const excelExport = new (require("../lib/Export"))();
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const Import = new (require("../lib/Import"))();
const {
  createEntity,
  updateEntity,
  deleteEntities,
  softDeleteEntities,
  restoreEntities
} = require("../utils/crudHelper");

let multerStorage = multer.diskStorage({
  destination: (req, file, next) => {
    next(null, config.FILE_UPLOAD_PATH);
  },
  filename: (req, file, next) => {
    next(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  }
});

const upload = multer({ storage: multerStorage }).single("image");

router.all("*", auth.authenticate(), (req, res, next) => {
  next();
});

// Tüm kayıtları getir
router.get("/", async (req, res) => {
  try {
    const languages = await Languages.find({});
    res.json(Response.successResponse(languages));
  } catch (error) {
    res.status(error.code || 500).json(Response.errorResponse(error));
  }
});

// Yeni kayıt ekle
router.post("/add", upload, async (req, res) => {
  console.log(req.body); // Frontendden gelen verileri kontrol et
  try {
    const response = await createEntity(
      Languages,
      req.body,
      req.file,
      req.user,
      req
    );
    res.json(response);
  } catch (error) {
    res.status(error.code || 500).json(Response.errorResponse(error));
  }
});

// Kayıt güncelle
router.post("/update", upload, async (req, res) => {
  try {
    const response = await updateEntity(
      Languages,
      req.body._id,
      req.body,
      req.file,
      req.user,
      req
    );
    res.json(response);
  } catch (error) {
    res.status(error.code || 500).json(Response.errorResponse(error));
  }
});

// Kayıt sil
router.post("/soft-delete", async (req, res) => {
  try {
    if (
      !req.body.ids ||
      !Array.isArray(req.body.ids) ||
      req.body.ids.length === 0
    ) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        req.t("errors:IDsMustBeProvided")
      );
    }

    const response = await softDeleteEntities(Languages, req.body.ids, req.user, req);
    res.json({ message: req.t("common:softDeleteSuccess"), data: response });
  } catch (error) {
    res.status(error.code || 500).json(Response.errorResponse(error));
  }
});

// Kalıcı sil
router.post("/delete", async (req, res) => {
  try {
    if (
      !req.body.ids ||
      !Array.isArray(req.body.ids) ||
      req.body.ids.length === 0
    ) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        req.t("errors:IDsMustBeProvided")
      );
    }

    const response = await deleteEntities(Languages, req.body.ids, req.user, req);
    res.json(response);
  } catch (error) {
    res.status(error.code || 500).json(Response.errorResponse(error));
  }
});

// Geri yükle
router.post("/restore", async (req, res) => {
  try {
    if (
      !req.body.ids ||
      !Array.isArray(req.body.ids) ||
      req.body.ids.length === 0
    ) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        req.t("errors:IDsMustBeProvided")
      );
    }

    const response = await restoreEntities(Languages, req.body.ids, req.user, req);
    res.json(response);
  } catch (error) {
    res.status(error.code || 500).json(Response.errorResponse(error));
  }
});

//Excele aktar
router.post(
  "/export",
  /*auth.checkRoles("category_export"),*/ async (req, res) => {
    try {
      let languages = await Languages.find({});

      let excel = excelExport.toExcel(
        [
          req.t("common:categoryName"),
          req.t("common:status"),
          req.t("common:tags"),
          req.t("common:description"),
          req.t("common:createdAt"),
          req.t("common:updatedAt")
        ],
        [
          "name",
          "is_active",
          "tags",
          "description",
          "created_at",
          "updated_at"
        ],
        languages
      );

      let filePath =
        __dirname + "/../tmp/categories_excel_" + Date.now() + ".xlsx";

      fs.writeFileSync(filePath, excel, "UTF-8");

      res.download(filePath);

      // fs.unlinkSync(filePath);
    } catch (err) {
      let errorResponse = Response.errorResponse(err);
      res.status(errorResponse.code).json(Response.errorResponse(err));
    }
  }
);

//Excelden al
router.post(
  "/import",
  /*auth.checkRoles("category_add"),*/ upload,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
            message: req.t('errors:noFileUploaded')
        });
      }

      let file = req.file;
      let body = req.body;

      // Dosya yolunu kontrol et
      // console.log("File Path:", file.path);

      let rows = Import.fromExcel(file.path);

      // Verileri kontrol et
      // console.log("Parsed Rows:", rows);

      // for (let i = 1; i < rows.length; i++) {
      //   let [name, is_active, user, created_at, updated_at] = rows[i];
      //   if (name) {
      //     await Categories.create({
      //       name,
      //       is_active: is_active === 'true' || is_active === true, // 'true' veya true ise true yap
      //       created_by: req.user._id
      //     });
      //   }
      // }

      // Mevcut kategori adlarını al
      const existingLanguages = await Languages.find()
        .select("name")
        .lean()
        .exec();
      const existingLanguageNames = existingLanguages.map(cat => cat.name);

      // Yeni kategorileri filtrele
      const newLanguages = rows.slice(1).filter(row => {
        const [name] = row;
        return name && !existingLanguageNames.includes(name);
      });

      // Yeni kategorileri ekle
      for (let i = 0; i < newLanguages.length; i++) {
        let [name, is_active, user, created_at, updated_at] = newLanguages[i];
        if (name) {
          await Languages.create({
            name,
            is_active: is_active === "true" || is_active === true, // 'true' veya true ise true yap
            created_by: req.user._id
          });
        }
      }

      res
        .status(Enum.HTTP_CODES.CREATED)
        .json(Response.successResponse(req.body, Enum.HTTP_CODES.CREATED));
    } catch (err) {
      console.error("Error:", err);
      let errorResponse = Response.errorResponse(err);
      res.status(errorResponse.code).json(errorResponse);
    }
  }
);

module.exports = router;
