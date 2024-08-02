export const entityFields = {
    categories: {
      name: { type: "string", required: true },
      is_active: { type: "boolean", default: true },
      created_by: { type: "objectId", required: false },
      image: { type: "string", required: false },
      tags: { type: "array", required: false, default: [] },
      description: { type: "string", required: false, default: "" },
      deleted_at: { type: "date", default: null },
    },
    contacts: {
      cit_number: { type: "number" },
      first_name: { type: "string", required: true },
      last_name: { type: "string", required: true },
      birth_place: { type: "string" },
      birth_day: { type: "string" },
      gender: { type: "string", required: true },
      mname: { type: "string" },
      fname: { type: "string" },
      blood_group: { type: "string" },
      education: { type: "string" },
      marital_status: { type: "string", required: true },
      dwelling_id: { type: "objectId" },
      phone_number: { type: "string" },
      gsm: { type: "string", required: true },
      address: { type: "string" },
      city: { type: "string" },
      province: { type: "string" },
      email: { type: "string" },
      web_page: { type: "string" },
      is_active: { type: "boolean", default: true },
      image: { type: "string", required: false },
      tags: { type: "array", required: false, default: [] },
      description: { type: "string", required: false, default: "" },
      created_by: { type: "objectId" },
      deleted_at: { type: "date", default: null },
    },
    users: {
      email: { type: "string", required: true, unique: true },
      password: { type: "string", required: true },
      is_active: { type: "boolean", default: true },
      first_name: { type: "string" },
      last_name: { type: "string" },
      phone_number: { type: "string" },
      language: { type: "string", default: "en" },
    },
    roles: {
      role_name: { type: "string", required: true, unique: true },
      is_active: { type: "boolean", default: true },
      created_by: { type: "objectId" },
    },
    user_roles: {
      role_id: { type: "objectId", required: true },
      user_id: { type: "objectId", required: true },
    },
    role_privileges: {
      role_id: { type: "objectId", required: true },
      permission: { type: "string", required: true },
      created_by: { type: "objectId" },
    }
  };
  