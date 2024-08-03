import { entityFields } from "../constants/entityFields";
import { message } from "antd";
import { apiService } from "../services/apiService";
import handleApiError from "./handleApiError";
import axios from "axios";
import i18n from "../i18n";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // .env dosyasındaki değeri al

export const addEntity = async (
  entityType,
  form,
  fileList,
  fetchEntities,
  setModalVisible,
  t
) => {
  try {
    const token = localStorage.getItem("token");
    const values = await form.validateFields();

    // Var olan varlıkları kontrol et
    const response = await apiService.get(`/api/${entityType}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const existingEntity = response.data.data.find(
      entity => entity.name.toLowerCase() === values.name.toLowerCase()
    );

    if (existingEntity) {
      message.error(
        t("common:COMMON.RECORD_ALREADY_EXISTS", { recName: values.name })
      );
      return;
    }

    const formData = new FormData();
    // Form verilerini ekle
    for (const key in entityFields[entityType]) {
      if (values[key] !== undefined && values[key] !== null) {
        if (key === "tags" && Array.isArray(values[key])) {
          // Tags dizisini JSON string olarak ekleyin
          formData.append(key, JSON.stringify(values[key]));
        } else {
          formData.append(key, values[key]);
        }
      }
    }

    // Resim dosyasını ekle
    if (fileList.length > 0) {
      formData.append("image", fileList[0]);
    }

    // formData'nın içeriğini kontrol et
    for (const pair of formData.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }

    // Kayıt işlemini gerçekleştir
    await apiService.post(`/api/${entityType}/add`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    });

    message.success(
      t("common:COMMON.ADD_SUCCESS_PARAM", { recName: values.name })
    );
    setModalVisible(false);
    form.resetFields();
    fetchEntities();
  } catch (error) {
    console.error(
      "Hata:",
      error.response ? error.response.data : error.message
    ); // Hata loglama
    handleApiError(error);
  }
};

export const editEntity = async (
  entityType,
  form,
  fileList,
  fetchEntities,
  setModalVisible,
  editingEntity,
  t
) => {
  try {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    const values = await form.validateFields();

    formData.append("_id", editingEntity._id);
    for (const key in entityFields[entityType]) {
      if (values[key] !== undefined && values[key] !== null) {
        if (key === "tags") {
          formData.append(key, JSON.stringify(values[key]));
        } else {
          formData.append(key, values[key]);
        }
      }
    }

    if (fileList.length > 0) {
      formData.append("image", fileList[0]);
    }

    await apiService.post(`/api/${entityType}/update`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    });

    message.success(t("common:COMMON.RECORD_UPDATE_SUCCESS", { recName : values.name}));
    setModalVisible(false);
    form.resetFields();
    fetchEntities();
  } catch (error) {
    handleApiError(error,t);
  }
};

export const deleteEntity = async (entityType, ids, fetchEntities, t) => {
  try {
    const token = localStorage.getItem("token");
    await axios.post(
      `${API_BASE_URL}/api/${entityType}/delete`,
      { ids },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    message.success(t("common:COMMON.DELETED_SUCCESS"));
    fetchEntities();
  } catch (error) {
    handleApiError(error, t);
  }
};

export const softDeleteEntity = async (entityType, ids, fetchEntities, t) => {
  try {
    const token = localStorage.getItem("token");
    await axios.post(
      `${API_BASE_URL}/api/${entityType}/soft-delete`,
      { ids },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    message.success(t("common:COMMON.SOFT_DELETED_SUCCESS"));
    fetchEntities();
  } catch (error) {
    handleApiError(error, t);
  }
};

export const restoreEntity = async (entityType, ids, fetchEntities, t) => {
  try {
    const token = localStorage.getItem("token");
    await axios.post(
      `${API_BASE_URL}/api/${entityType}/restore`,
      { ids },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    message.success(t("common:COMMON.RESTORED_SUCCESS"));
    fetchEntities();
  } catch (error) {
    handleApiError(error, t);
  }
};

// Veri al
export const fetchData = async (
  endpoint,
  setLoading,
  setDataSource,
  setPrintTable,
  t
) => {
  setLoading(true);
  const token = localStorage.getItem("token"); // Token'ı al

  try {
    const response = await axios.get(`${API_BASE_URL}/api/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}` // Token'ı ekle
      }
    });
    setDataSource(response.data);
    setPrintTable(response.data);
  } catch (error) {
    console.error("Veri çekme hatası:", error);
    message.error(t("common:COMMON.FETCH_ERROR"));
    handleApiError(error);
  } finally {
    setLoading(false);
  }
};

// Veri güncelle
export const updateStatus = async (tableName, id, data, fetchFunction, t) => {
  const token = localStorage.getItem("token");

  try {
    await axios.post(
      `${API_BASE_URL}/api/${tableName}/update`,
      {
        _id: id,
        ...data
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    message.success(t("common:COMMON.STATUS_UPDATED"));
    fetchFunction();
  } catch (error) {
    handleApiError(error);
  }
};

// Dışa aktar
export const exportData = async (tableName, setLoading, t) => {
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_BASE_URL}/api/${tableName}/export`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        responseType: "blob"
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${tableName}_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    handleApiError(error, t);
  } finally {
    setLoading(false);
  }
};

// Dosya yükleme
export const uploadFile = async (tableName, file, t) => {
  if (!file) {
    message.success(t("common:COMMON.SELECT_FILE"));
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/${tableName}/import`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

    if (response.status === 201) {
      message.success(t("common:FILE_UPLOADED_SUCCESS"));
    } else {
      message.error(t("common:FILE_UPLOADED_ERROR"));
    }
  } catch (error) {
    console.error("Upload error:", error);
    message.error(t("common:FILE_UPLOADED_ERROR"));
  }
};

export const printEntity = (entityName, selectedColumns, printTable, orientation, paperSize) => {
    const doc = new jsPDF({
        orientation,
        unit: "pt",
        format: paperSize
    });

    const tableColumn = selectedColumns.map(col => col.title);
    const tableRows = printTable.map(item =>
        selectedColumns.map(col => item[col.dataIndex])
    );

    doc.autoTable({
        head: [tableColumn],
        body: tableRows
    });

    doc.save(`${entityName}.pdf`);
};

