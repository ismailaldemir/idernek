var express = require("express");
const bcrypt = require("bcrypt-nodejs");
const is = require("is_js");
const jwt = require("jwt-simple");

const Users = require("../db/models/Users");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const UserRoles = require("../db/models/UserRoles");
const Roles = require("../db/models/Roles");
const config = require("../config");
var router = express.Router();
const auth = require("../lib/auth")();
const i18n = new (require("../lib/i18n"))(config.DEFAULT_LANG);
const { rateLimit } = require("express-rate-limit");
const RateLimitMongo = require("rate-limit-mongo");

const limiter = rateLimit({
  store: new RateLimitMongo({
    uri: config.CONNECTION_STRING,
    collectionName: "rateLimits",
    expireTimeMs: 15 * 60 * 1000 // 15 minutes
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  legacyHeaders: false // Disable the `X-RateLimit-*` headers.
});

router.post("/auth", limiter, async (req, res) => {
  try {
    let { email, password } = req.body;

    Users.validateFieldsBeforeAuth(email, password);

    let user = await Users.findOne({ email });

    if (!user) {
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", config.DEFAULT_LANG),
        i18n.translate("USERS.AUTH_ERROR", config.DEFAULT_LANG)
      );
    }

    if (!user.validPassword(password)) {
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", config.DEFAULT_LANG),
        i18n.translate("USERS.AUTH_ERROR", config.DEFAULT_LANG)
      );
    }

    let payload = {
      id: user._id,
      exp: parseInt(Date.now() / 1000) + config.JWT.EXPIRE_TIME
    };

    let token = jwt.encode(payload, config.JWT.SECRET);

    let userData = {
      _id: user._id,
      first_name: user.first_name || "N/A",
      last_name: user.last_name || "N/A"
    };

    /* log Token and userData
    console.log("Generated Token: ", token);
    console.log("User Data: ", userData);
*/
    res.json({
      success: true,
      token: token,
      user: userData
    });
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/register", async (req, res) => {
  const { email, password, first_name, last_name, phone_number } = req.body;

  try {
    // Check if the user already exists
    let user = await Users.findOne({ email });

    if (user) {
      throw new CustomError(
        Enum.HTTP_CODES.CONFLICT,
        "Validation Error",
        "User with this email already exists."
      );
    }

    // Validate email
    if (!email) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        "Email field must be filled."
      );
    }
    if (is.not.email(email)) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        "Email must be in a valid email format."
      );
    }

    // Validate password
    if (!password) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        "Password field must be filled."
      );
    }
    if (password.length < Enum.PASS_LENGTH) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error",
        `Password must be at least ${Enum.PASS_LENGTH} characters long.`
      );
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(
      password,
      bcrypt.genSaltSync(8),
      null
    );

    // Create the new user
    const newUser = await Users.create({
      email,
      password: hashedPassword,
      is_active: true,
      first_name,
      last_name,
      phone_number
    });

    res
      .status(Enum.HTTP_CODES.CREATED)
      .json(
        Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED)
      );
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});
router.all("*", auth.authenticate(), (req, res, next) => {
  next();
});

/* GET users listing. */
router.get("/", async (req, res) => {
  try {
    let users = await Users.find({}, { password: 0 }).lean();

    for (let i = 0; i < users.length; i++) {
      let roles = await UserRoles.find({ user_id: users[i]._id }).populate("role_id");
      users[i].roles = roles;
    }

    const currentUser = req.user._id; // Oturum açmış kullanıcının id'sini al

    res.json(Response.successResponse({ users, currentUser }));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post(
  "/add",
  /*auth.checkRoles("user_add"),*/ async (req, res) => {
    let body = req.body;

    try {
      if (!body.email) {
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
          i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
            "email"
          ])
        );
      }
      if (is.not.email(body.email)) {
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
          i18n.translate("USERS.EMAIL_FORMAT_ERROR", req.user.language)
        );
      }

      if (!body.password) {
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
          i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
            "password"
          ])
        );
      }

      if (body.password.length < Enum.PASS_LENGTH) {
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
          i18n.translate("USERS.PASSWORD_LENGTH_ERROR", req.user.language, [
            Enum.PASS_LENGTH
          ])
        );
      }

      if (!body.roles || !Array.isArray(body.roles) || body.roles.length == 0) {
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
          i18n.translate("COMMON.FIELD_MUST_BE_TYPE", req.user.language, [
            "roles",
            "Array"
          ])
        );
      }

      let roles = await Roles.find({ _id: { $in: body.roles } });

      if (roles.length == 0) {
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
          i18n.translate("COMMON.FIELD_MUST_BE_TYPE", req.user.language, [
            "roles",
            "Array"
          ])
        );
      }

      let password = bcrypt.hashSync(
        body.password,
        bcrypt.genSaltSync(8),
        null
      );

      let user = await Users.create({
        email: body.email,
        password,
        is_active: true,
        first_name: body.first_name,
        last_name: body.last_name,
        phone_number: body.phone_number
      });

      for (let i = 0; i < roles.length; i++) {
        await UserRoles.create({
          role_id: roles[i]._id,
          user_id: user._id
        });
      }

      res
        .status(Enum.HTTP_CODES.CREATED)
        .json(
          Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED)
        );
    } catch (error) {
      let errorResponse = Response.errorResponse(error);
      res.status(errorResponse.code).json(errorResponse);
    }
  }
);

router.post(
  "/update",
  /*auth.checkRoles("user_update"),*/ async (req, res) => {
    let body = req.body;

    let updates = {};

    try {
      if (!body._id) {
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
          i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
            "_id"
          ])
        );
      }

      if (body.password && body.password.length < Enum.PASS_LENGTH) {
        updates.password = bcrypt.hashSync(
          body.password,
          bcrypt.genSaltSync(8),
          null
        );
      }
      if (typeof body.is_active === "boolean")
        updates.is_active = body.is_active;
      if (body.first_name) updates.first_name = body.first_name;
      if (body.last_name) updates.last_name = body.last_name;
      if (body.phone_number) updates.phone_number = body.phone_number;

      //kullanıcının kendi yetkilerini yükseltmesi engelleniyor
      if (body._id == req.user.id) {
        // throw new CustomError(Enum.HTTP_CODES.FORBIDDEN, i18n.translate("COMMON.NEED_PERMISSIONS", req.user.language), i18n.translate("COMMON.NEED_PERMISSIONS", req.user.language))
        body.roles = null;
      }

      if (Array.isArray(body.roles) && body.roles.length > 0) {
        let userRoles = await UserRoles.find({ user_id: body._id });

        let removedRoles = userRoles.filter(
          x => !body.roles.includes(x.role_id)
        );
        let newRoles = body.roles.filter(
          x => !userRoles.map(r => r.role_id).includes(x)
        );

        if (removedRoles.length > 0) {
          await UserRoles.deleteMany({
            _id: { $in: removedRoles.map(x => x._id.toString()) }
          });
        }

        if (newRoles.length > 0) {
          for (let i = 0; i < newRoles.length; i++) {
            let userRole = new UserRoles({
              role_id: newRoles[i],
              user_id: body._id
            });

            await userRole.save();
          }
        }
      }

      await Users.updateOne({ _id: body._id }, updates);

      res.json(Response.successResponse({ success: true }));
    } catch (error) {
      let errorResponse = Response.errorResponse(error);
      res.status(errorResponse.code).json(errorResponse);
    }
  }
);

router.post(
  "/delete",
  /*auth.checkRoles("user_delete"),*/ async (req, res) => {
    try {
      let body = req.body;

      if (!body._id) {
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
          i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
            "_id"
          ])
        );
      }

      await Users.deleteOne({ _id: body._id });

      await UserRoles.deleteMany({ user_id: body._id });

      res.json(Response.successResponse({ success: true }));
    } catch (error) {
      let errorResponse = Response.errorResponse(error);
      res.status(errorResponse.code).json(errorResponse);
    }
  }
);

module.exports = router;
