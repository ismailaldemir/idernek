var express = require("express");
var router = express.Router();
const Categories = require("../db/models/Categories");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const AuditLogs = require("../lib/AuditLogs");
const logger = require("../lib/logger/LoggerClass");
const config = require("../config");
const auth = require("../lib/auth")();
const i18n = new (require("../lib/i18n"))(config.DEFAULT_LANG);
const emitter = require("../lib/Emitter");
const excelExport = new (require("../lib/Export"))();
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const Import = new (require("../lib/Import"))();

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

//Tüm kategorileri getir, silinen kayıtları dahil etme
router.get(
  "/",
  /*auth.checkRoles("category_view"),*/ async (req, res, next) => {
    try {
      let categories = await Categories.find({});
      res.json(Response.successResponse(categories));
    } catch (error) {
      let errorResponse = Response.errorResponse(error);
      res.status(errorResponse.code).json(Response.errorResponse(error));
    }
  }
);

router.post("/add", upload, async (req, res) => {
  let body = req.body;
  let file = req.file;

  try {
    if (!body.name)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "name"
        ])
      );

    // Kategori adının benzersiz olduğunu kontrol et
    const existingCategory = await Categories.findOne({ name: body.name });
    if (existingCategory) {
      throw new CustomError(
        Enum.HTTP_CODES.CONFLICT,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("CATEGORY.ALREADY_EXISTS", req.user.language, [
          body.name
        ])
      );
    }

    const newCategory = new Categories({
      name: body.name,
      is_active: body.is_active,
      created_by: req.user._id,
      image: file ? file.filename : undefined,
      tags: body.tags ? JSON.parse(body.tags) : [], // tags alanı
      description: body.description || "" // description alanı
    });

    await newCategory.save();

    res.json(Response.successResponse(newCategory));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/update", upload, async (req, res) => {
  let body = req.body;
  let file = req.file;

  try {
    if (!body._id) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR")
      );
    }

    let category = await Categories.findById(body._id);

    if (!category) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("CATEGORY.CATEGORY_NOT_FOUND")
      );
    }

    // Kategori güncelle
    category.name = body.name || category.name;
    category.is_active =
      body.is_active !== undefined ? body.is_active : category.is_active;
    category.tags = body.tags ? JSON.parse(body.tags) : category.tags;
    category.description =
      body.description !== undefined ? body.description : category.description;

    // Yeni resmi ekle
    if (file) {
      // Eski resmi sil
      if (category.image) {
        const oldImagePath = path.join(config.FILE_UPLOAD_PATH, category.image);
        if (fs.existsSync(oldImagePath)) {
          await fs.promises.unlink(oldImagePath);
        }
      }
      category.image = file.filename;
    }

    await category.save();

    res.json(Response.successResponse(category));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/soft-delete", async (req, res) => {
  let body = req.body;
  try {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "ids"
        ])
      );
    }

    // Kategorilerin deleted_at alanını güncelle
    await Categories.updateMany(
      { _id: { $in: body.ids } },
      { $set: { deleted_at: new Date() } }
    );

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/hard-delete", async (req, res) => {
  let body = req.body;
  try {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "ids"
        ])
      );
    }

    // Kategorileri bul ve sil
    const categoriesToDelete = await Categories.find({
      _id: { $in: body.ids }
    });

    await Categories.deleteMany({ _id: { $in: body.ids } });

    // Silinen kategorilere ait resimleri sil
    for (const category of categoriesToDelete) {
      if (category.image) {
        const filePath = path.join(config.FILE_UPLOAD_PATH, category.image);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      }
    }

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/delete", async (req, res) => {
  let body = req.body;
  try {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "ids"
        ])
      );
    }

    // Kategorileri bul
    const categoriesToDelete = await Categories.find({
      _id: { $in: body.ids }
    });

    // console.log("Silinecek Kategoriler:", categoriesToDelete);

    // Kategorileri sil
    await Categories.deleteMany({ _id: { $in: body.ids } });

    // Silinen kategorilere ait resimleri sil
    for (const category of categoriesToDelete) {
      if (category.image) {
        const filePath = path.join(config.FILE_UPLOAD_PATH, category.image);
        console.log(`Tam Dosya Yolu: ${filePath}`);

        try {
          if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
          } else {
            console.warn(`Dosya bulunamadı: ${filePath}`);
          }
        } catch (err) {
          console.error(`Dosya silinemedi: ${filePath}`, err);
        }
      } else {
        console.warn(`Resim yok, kategori silinecek: ${category._id}`);
      }
    }

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    console.error("Silme işlemi sırasında hata:", error);
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/restore", async (req, res) => {
  let body = req.body;
  try {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "ids"
        ])
      );
    }

    await Categories.updateMany(
      { _id: { $in: body.ids } },
      { $set: { deleted_at: null } }
    );

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post(
  "/export",
  /*auth.checkRoles("category_export"),*/ async (req, res) => {
    try {
      let categories = await Categories.find({});

      let excel = excelExport.toExcel(
        [
          "Kategori Adı",
          "Durum",
          "Etiketler",
          "Açıklama",
          "Eklenme Tarihi",
          "Güncellenme Tarihi"
        ],
        [
          "name",
          "is_active",
          "tags",
          "description",
          "created_at",
          "updated_at"
        ],
        categories
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

router.post(
  "/import",
  /*auth.checkRoles("category_add"),*/ upload,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          message: "No file uploaded"
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
      const existingCategories = await Categories.find()
        .select("name")
        .lean()
        .exec();
      const existingCategoryNames = existingCategories.map(cat => cat.name);

      // Yeni kategorileri filtrele
      const newCategories = rows.slice(1).filter(row => {
        const [name] = row;
        return name && !existingCategoryNames.includes(name);
      });

      // Yeni kategorileri ekle
      for (let i = 0; i < newCategories.length; i++) {
        let [name, is_active, user, created_at, updated_at] = newCategories[i];
        if (name) {
          await Categories.create({
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
