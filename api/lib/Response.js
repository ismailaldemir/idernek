const Enum = require("../config/Enum");
const config = require("../config");
const CustomError = require("./Error");
const i18n = require("../i18n"); 

class Response {
  constructor() {}

  static successResponse(data, code = 200) {
    return {
      code,
      data
    };
  }

  static errorResponse(error, lang) {
    if (error instanceof CustomError) {
      return {
        code: error.code,
        error: {
          message: error.message,
          description: error.description
        }
      };
    } else if (error.message.includes("E11000")) {
      return {
        code: Enum.HTTP_CODES.CONFLICT,
        error: {
          message: i18n.t("ERRORS.ALREADY_EXIST", { lng: lang }),
          description: i18n.t("ERRORS.ALREADY_EXIST", { lng: lang })
        }
      };
    }
    return {
      code: Enum.HTTP_CODES.INT_SERVER_ERROR,
      error: {
        message: i18n.t("ERRORS.UNKNOWN_ERROR", { lng: lang }),
        description: error.message
      }
    };
  }
}

module.exports = Response;
