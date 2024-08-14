// helpers/auditLogHelper.js
const AuditLog = require('../db/models/AuditLogs'); // AuditLog modelini içe aktarın

const createAuditLog = async ({ user, action, entity, entityId, oldValue, newValue, userAgentInfo }) => {
  try {
    const auditLog = new AuditLog({
      user_id: user.id, // Kullanıcı ID'si
      action, // Yapılan eylem (create, update, delete, restore vs.)
      entity, // İlgili modelin adı (tablo adı)
      entity_id: entityId, // İlgili kaydın ID'si
      old_value: oldValue, // Önceki değer
      new_value: newValue, // Yeni değer
      user_agent: userAgentInfo, // User agent bilgileri
      ip_address: userAgentInfo.ip_address, // IP adresi
      browser: userAgentInfo.browser.name, // Tarayıcı bilgisi
      os: userAgentInfo.os.name, // İşletim sistemi bilgisi
      device: userAgentInfo.device.type, // Cihaz türü
    });

    await auditLog.save();
  } catch (error) {
    console.error('Audit log kaydı oluşturulurken hata oluştu:', error);
    throw new Error('Audit log kaydı oluşturulamadı.');
  }
};

module.exports = { createAuditLog };
