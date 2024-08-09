const mongoose = require("mongoose");
const { Schema } = mongoose;

const auditLogSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: "Users", required: true }, // İşlemi yapan kullanıcı ID'si
    action: { type: String, required: true }, // İşlem türü: create, read, update, delete, vb.
    entity: { type: String, required: true }, // İşlem yapılan tablo veya koleksiyon adı
    entity_id: { type: Schema.Types.ObjectId, required: true }, // İşlem yapılan kaydın ID'si
    old_value: { type: Schema.Types.Mixed, default: null }, // Güncelleme öncesi eski değer
    new_value: { type: Schema.Types.Mixed, default: null }, // Güncelleme sonrası yeni değer
    level: { type: String }, // Seviyeyi tutmak için (Opsiyonel)
    email: { type: String }, // Kullanıcı e-postası (Opsiyonel)
    location: { type: String }, // İşlemin yapıldığı yer (Opsiyonel)
    proc_type: { type: String }, // İşlem türü (Opsiyonel)
    log: { type: Schema.Types.Mixed }, // Ekstra log bilgileri (Opsiyonel)
    ip_address: { type: String }, // Kullanıcının IP adresi
    device: { type: String }, // Kullanıcının cihaz türü
    browser: { type: String }, // Kullanıcının tarayıcı bilgisi
    os: { type: String }, // Kullanıcının işletim sistemi
    is_mobile: { type: Boolean, default: false }, // Kullanıcının mobil olup olmadığı
}, {
    versionKey: false,
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});

class AuditLogs extends mongoose.Model {
    // Şema üzerine özel metotlar eklemek için
}

auditLogSchema.loadClass(AuditLogs);
module.exports = mongoose.model("AuditLogs", auditLogSchema);
