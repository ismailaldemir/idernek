var express = require("express");
var router = express.Router();
const Contacts = require("../db/models/Contacts");
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

//Tüm kişileri getir, silinen kayıtları dahil etme
router.get(
  "/",
  /*auth.checkRoles("contact_view"),*/ async (req, res, next) => {
    try {
      let contacts = await Contacts.find({});
      res.json(Response.successResponse(contacts));
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
    if (!body.first_name)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "first_name"
        ])
      );

    // Kişi Tc kimlik numarasının benzersiz olduğunu kontrol et
    const existingContact = await Contacts.findOne({ cit_number: body.cit_number });
    if (existingContact) {
      throw new CustomError(
        Enum.HTTP_CODES.CONFLICT,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("CATEGORY.ALREADY_EXISTS", req.user.language, [
          body.cit_number
        ])
      );
    }

    const newContact = new Contacts({
      cit_number: body.cit_number,
      first_name: body.first_name,
      last_name: body.last_name,
      birth_place: body.birth_place,
      birth_day: body.birth_day,
      gender: body.gender,
      mname: body.mname,
      fname: body.fname,
      blood_group: body.blood_group,
      education: body.education,
      marital_status: body.marital_status,
      dwelling_id: body.dwelling_id,
      phone_number: body.phone_number,
      gsm: body.gsm,
      address: body.address,
      city: body.city,
      province: body.province,
      email: body.email,
      web_page: body.web_page,
      is_active: body.is_active,
      created_by: req.user._id,
      image: file ? file.filename : undefined,
      tags: body.tags ? JSON.parse(body.tags) : [], // tags alanı
      description: body.description || "" // description alanı
    });

    await newContact.save();

    res.json(Response.successResponse(newContact));
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

    let contact = await Contacts.findById(body._id);

    if (!contact) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("CATEGORY.CATEGORY_NOT_FOUND")
      );
    }

    // Kişi güncelle
    contact.cit_number = body.cit_number || contact.cit_number;
    contact.first_name = body.first_name || contact.first_name;
    contact.last_name = body.last_name || contact.last_name;
    contact.birth_place = body.birth_place || contact.birth_place;
    contact.birth_day = body.birth_day || contact.birth_day;
    contact.gender = body.gender || contact.gender;
    contact.mname = body.mname || contact.mname;
    contact.fname = body.fname || contact.fname;
    contact.blood_group = body.blood_group || contact.blood_group;
    contact.education = body.education || contact.education;
    contact.marital_status = body.marital_status || contact.marital_status;
    contact.dwelling_id = body.dwelling_id || contact.dwelling_id;
    contact.phone_number = body.phone_number || contact.phone_number;
    contact.gsm = body.gsm || contact.gsm;
    contact.address = body.address || contact.address;
    contact.city = body.city || contact.city;
    contact.province = body.province || contact.province;
    contact.email = body.email || contact.email;
    contact.web_page = body.web_page || contact.web_page;
    contact.is_active =
      body.is_active !== undefined ? body.is_active : contact.is_active;
    contact.tags = body.tags ? JSON.parse(body.tags) : contact.tags;
    contact.description =
      body.description !== undefined ? body.description : contact.description;

    // Yeni resmi ekle
    if (file) {
      // Eski resmi sil
      if (contact.image) {
        const oldImagePath = path.join(config.FILE_UPLOAD_PATH, contact.image);
        if (fs.existsSync(oldImagePath)) {
          await fs.promises.unlink(oldImagePath);
        }
      }
      contact.image = file.filename;
    }

    await contact.save();

    res.json(Response.successResponse(contact));
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

    // Kişilerin deleted_at alanını güncelle
    await Contacts.updateMany(
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

    // Kişileri bul ve sil
    const contactsToDelete = await Contacts.find({
      _id: { $in: body.ids }
    });

    await Contacts.deleteMany({ _id: { $in: body.ids } });

    // Silinen kişilere ait resimleri sil
    for (const contact of contactsToDelete) {
      if (contact.image) {
        const filePath = path.join(config.FILE_UPLOAD_PATH, contact.image);
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

    // Kişileri bul
    const contactsToDelete = await Contacts.find({
      _id: { $in: body.ids }
    });

    // console.log("Silinecek Kişiler:", contactsToDelete);

    // Kişileri sil
    await Contacts.deleteMany({ _id: { $in: body.ids } });

    // Silinen kişilere ait resimleri sil
    for (const contact of contactsToDelete) {
      if (contact.image) {
        const filePath = path.join(config.FILE_UPLOAD_PATH, contact.image);
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
        console.warn(`Resim yok, kişi silinecek: ${contact._id}`);
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

    await Contacts.updateMany(
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
  /*auth.checkRoles("contact_export"),*/ async (req, res) => {
    try {
      let contacts = await Contacts.find({});

      let excel = excelExport.toExcel(
        [
          "Adı",
          "Soyadı",
          "Durum",
          "Etiketler",
          "Açıklama",
          "Eklenme Tarihi",
          "Güncellenme Tarihi"
        ],
        [
          "first_name",
          "last_name",
          "is_active",
          "tags",
          "description",
          "created_at",
          "updated_at"
        ],
        contacts
      );

      let filePath =
        __dirname + "/../tmp/contacts_excel_" + Date.now() + ".xlsx";

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
  /*auth.checkRoles("contact_add"),*/ upload,
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
      //     await Contacts.create({
      //       name,
      //       is_active: is_active === 'true' || is_active === true, // 'true' veya true ise true yap
      //       created_by: req.user._id
      //     });
      //   }
      // }

      // Mevcut kişi adlarını al
      const existingContacts = await Contacts.find()
        .select("cit_number")
        .lean()
        .exec();
      const existingContactNames = existingContacts.map(cat => cat.name);

      // Yeni kişileri filtrele
      const newContacts = rows.slice(1).filter(row => {
        const [name] = row;
        return name && !existingContactNames.includes(name);
      });

      // Yeni kişileri ekle
      for (let i = 0; i < newContacts.length; i++) {
        let [
          cit_number,
          first_name,
          last_name,
          is_active,
          user,
          created_at,
          updated_at
        ] = newContacts[i];
        if (cit_number) {
          await Contacts.create({
            first_name,
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
