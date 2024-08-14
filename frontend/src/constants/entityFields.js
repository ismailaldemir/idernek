export const entityFields = {
  categories: {
    name: { type: "string", required: true },
    is_active: { type: "boolean", default: true },
    created_by: { type: "objectId", required: false },
    image: { type: "string", required: false },
    tags: { type: "array", required: false, default: [] },
    description: { type: "string", required: false, default: "" },
    deleted_at: { type: "date", default: null },
    parent_id: { type: "objectId", required: false },
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
    deleted_at: { type: "date", default: null }
  },
  users: {
    email: { type: "string", required: true, unique: true },
    password: { type: "string", required: true },
    is_active: { type: "boolean", default: true },
    first_name: { type: "string" },
    last_name: { type: "string" },
    phone_number: { type: "string" },
    language: { type: "string", default: "en" }
  },
  roles: {
    role_name: { type: "string", required: true, unique: true },
    is_active: { type: "boolean", default: true },
    created_by: { type: "objectId" }
  },
  user_roles: {
    role_id: { type: "objectId", required: true },
    user_id: { type: "objectId", required: true }
  },
  role_privileges: {
    role_id: { type: "objectId", required: true },
    permission: { type: "string", required: true },
    created_by: { type: "objectId" }
  },
  languages: {
    lang: { type: "string", required: true },
    name: { type: "string", required: true },
    slug: { type: "string", unique: true },
    is_active: { type: "boolean", default: true },
    created_by: { type: "objectId", required: false },
    image: { type: "string", required: false },
    tags: { type: "array", required: true },  
    description: { type: "string", required: false },
    deleted_at: { type: "date", default: null }
  }
};


// alanların özel değerlerini entity için hazırlama 
export const prepareEntityValues = (entityType, values) => {
  const entityFieldsMap = entityFields[entityType]; 
  const modifiedValues = {};

  for (const key in entityFieldsMap) {
    if (values[key] !== undefined) {
      // Eğer parent_id -1 ise null yap
      modifiedValues[key] = key === 'parent_id' && values[key] === '-1' ? null : values[key];
    }
  }

  // tags alanını JSON formatına çevir
  if (values.tags) {
    modifiedValues.tags = JSON.stringify(values.tags);
  }

  // language alanını kontrol et
  if (values.language) {
    modifiedValues.language = values.language;
  }

   // İşlenen verileri kontrol et
   console.log("Modified Values:", modifiedValues);

  return modifiedValues;
};
