// middleware/userAgentMiddleware.js
const userAgentMiddleware = (req, res, next) => {
    // express-useragent middleware tarafından eklenen `req.useragent` nesnesini kullanıyoruz
    req.userAgentInfo = {
        userAgent: req.headers['user-agent'], // Tam user agent dizesi
        browser: {
            name: req.useragent.browser,       // Tarayıcı adı
            version: req.useragent.version,    // Tarayıcı sürümü
        },
        os: {
            name: req.useragent.os,            // İşletim sistemi adı
        },
        device: {
            type: req.useragent.platform,      // Cihaz türü (Masaüstü, Mobil, vb.)
            isMobile: req.useragent.isMobile,  // Mobil cihaz olup olmadığını belirtir
            isTablet: req.useragent.isTablet,  // Tablet olup olmadığını belirtir
            isDesktop: req.useragent.isDesktop,// Masaüstü bilgisayar olup olmadığını belirtir
        },
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress, // IP adresi
        acceptedLanguages: req.acceptsLanguages(), // Kullanıcının kabul ettiği diller
        headers: req.headers // Tüm başlıklar
    };

    next();
};

module.exports = userAgentMiddleware;
