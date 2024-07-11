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

/* GET categories listing. */
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

// router.post(
//   "/add",
//   /*auth.checkRoles("category_add"),*/ async (req, res) => {
//     let body = req.body;

//     try {
//       if (!body.name)
//         throw new CustomError(
//           Enum.HTTP_CODES.BAD_REQUEST,
//           i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
//           i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
//             "name"
//           ])
//         );

//       let category = new Categories({
//         name: body.name,
//         is_active: true,
//         created_by: req.user.id
//       });

//       await category.save();

//       //auditlogs kaydı ekleniyor
//       AuditLogs.info(req.user.email, "Categories", "Add", category);
//       logger.info(req.user.email, "Categories", "Add", category);

//       //yapılan işleme ait bildirim mesajı görüntüleniyor
//       emitter
//         .getEmitter("notifications")
//         .emit("messages", { message: category.name + " is added" });

//       res.json(Response.successResponse({ success: true }));
//     } catch (error) {
//       logger.error(null, "Categories", "Add", error);
//       let errorResponse = Response.errorResponse(error);
//       res.status(errorResponse.code).json(errorResponse);
//     }
//   }
// );

// router.post(
//   "/update",
//   /*auth.checkRoles("category_update"),*/ async (req, res) => {
//     let body = req.body;

//     try {
//       if (!body._id)
//         throw new CustomError(
//           Enum.HTTP_CODES.BAD_REQUEST,
//           i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
//           i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
//             "id"
//           ])
//         );

//       let updates = {};

//       if (body.name) updates.name = body.name;
//       if (typeof body.is_active === "boolean")
//         updates.is_active = body.is_active;

//       await Categories.updateOne({ _id: body._id }, updates);

//       //auditlogs kaydı ekleniyor
//       AuditLogs.info(null, "Categories", "Update", {
//         _id: body._id,
//         ...updates
//       });

//       res.json(Response.successResponse({ success: true }));
//     } catch (error) {
//       let errorResponse = Response.errorResponse(error);
//       res.status(errorResponse.code).json(errorResponse);
//     }
//   }
// );
router.post("/add", upload, async (req, res) => {
  let body = req.body;
  let file = req.file;

  try {
    if (!body.name) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR")
      );
    }

    const newCategory = new Categories({
      name: body.name,
      is_active: body.is_active,
      created_by: req.user._id,
      image: file ? file.filename : undefined
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

    category.name = body.name;
    category.is_active = body.is_active;
    if (file) {
      category.image = file.filename;
    }

    await category.save();

    res.json(Response.successResponse(category));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});
router.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(config.FILE_UPLOAD_PATH, filename);

  res.sendFile(filePath);
});

router.post(
  "/delete",
  /*auth.checkRoles("category_delete"),*/ async (req, res) => {
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

      await Categories.deleteMany({ _id: { $in: body.ids } });

      // Audit log kaydı ekleme
      // AuditLogs.info(null, "Categories", "Delete", { _id: body.ids });

      res.json(Response.successResponse({ success: true }));
    } catch (error) {
      let errorResponse = Response.errorResponse(error);
      res.status(errorResponse.code).json(errorResponse);
    }
  }
);

router.post(
  "/export",
  /*auth.checkRoles("category_export"),*/ async (req, res) => {
    try {
      let categories = await Categories.find({});

      let excel = excelExport.toExcel(
        ["NAME", "IS ACTIVE?", "USER_ID", "CREATED AT", "UPDATED AT"],
        ["name", "is_active", "created_by", "created_at", "updated_at"],
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
      let file = req.file;
      let body = req.body;

      let rows = Import.fromExcel(file.path);

      for (let i = 1; i < rows.length; i++) {
        let [name, is_active, user, created_at, updated_at] = rows[i];
        if (name) {
          await Categories.create({
            name,
            is_active,
            created_by: req.user._id
          });
        }
      }

      res
        .status(Enum.HTTP_CODES.CREATED)
        .json(Response.successResponse(req.body, Enum.HTTP_CODES.CREATED));
    } catch (err) {
      let errorResponse = Response.errorResponse(err);
      res.status(errorResponse.code).json(Response.errorResponse(err));
    }
  }
);

module.exports = router;
