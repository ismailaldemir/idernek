import { message } from 'antd';

const handleApiError = (error, t) => {
    console.error("API hatası:", error);

    if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
            case 400:
                message.error(t("COMMON.BAD_REQUEST"));
                break;
            case 401:
                message.error(t("COMMON.NEED_PERMISSIONS"));
                break;
            case 403:
                message.error(t("COMMON.FORBIDDEN"));
                break;
            case 404:
                message.error(t("COMMON.NOT_FOUND"));
                break;
            case 500:
                message.error(t("COMMON.SERVER_ERROR"));
                break;
            default:
                if (data && data.message) {
                    message.error(data.message);
                } else {
                    message.error(t("COMMON.TRANSACTION_COMPLETE_ERROR"));
                }
                break;
        }
    } else if (error.request) {
        // İstek yapıldı, ancak sunucudan yanıt alınamadı
        message.error(t("COMMON.NO_RESPONSE"));
    } else {
        // Başka bir hata oluştu
        message.error(error.message);
    }
};

export default handleApiError;
