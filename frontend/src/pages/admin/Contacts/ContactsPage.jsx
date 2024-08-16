import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  message,
  Modal,
  Checkbox,
  Select,
  Tag,
  Switch,
  Upload,
  Form,
  Input,
  Popconfirm,
  Row,
  Col,
  Tabs,
  Card,
  Tooltip
} from "antd";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import moment from "moment";
import {
  PrinterOutlined,
  SearchOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  EditOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  RollbackOutlined,
  CloseCircleOutlined,
  StopOutlined,
  IdcardOutlined,
  UserAddOutlined
} from "@ant-design/icons";
import "./../admin.css";
import Highlighter from "react-highlight-words";
import { ValidateError } from "antd/lib/form/Form";
import { useForm } from "antd/lib/form/Form";
import { useTranslation } from "react-i18next";

const { Option } = Select;
const { Dragger } = Upload;
const { TabPane } = Tabs;

const ContactsPage = () => {
  const [dataSource, setDataSource] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [printTable, setPrintTable] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [printVisible, setPrintVisible] = useState(false);
  const [paperSize, setPaperSize] = useState("a4");
  const [orientation, setOrientation] = useState("landscape");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [form] = useForm();
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const { t } = useTranslation();

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (editingContact) {
      setFileList([]);
    }
  }, [editingContact]);

  useEffect(() => {
    filterData();
  }, [dataSource, activeTab]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/contacts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const formattedData = response.data.data.map(item => ({
        ...item,
        key: item._id,
        imageUrl: `${API_BASE_URL}/images/${item.image}`
      }));

      setDataSource(formattedData);
      setPrintTable(formattedData);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    switch (activeTab) {
      case "active":
        setFilteredData(
          dataSource.filter(item => item.is_active && !item.deleted_at)
        );
        break;
      case "inactive":
        setFilteredData(
          dataSource.filter(item => !item.is_active && !item.deleted_at)
        );
        break;
      case "pending":
        setFilteredData(
          dataSource.filter(
            item => item.status === "pending" && !item.deleted_at
          )
        );
        break;
      case "deleted":
        setFilteredData(dataSource.filter(item => item.deleted_at));
        break;
      default:
        setFilteredData(dataSource);
    }
  };

  const handleTabChange = key => {
    setActiveTab(key);
  };

  const handleApiError = error => {
    console.error("API hatası:", error);
    if (error.response && error.response.status === 401) {
      message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın..");
      window.location.href = "/login";
      //TODO:react router dom history kullanımına bakılacak
    } else {
      message.error("İşlem gerçekleştirilemedi..");
    }
  };

  const handleActiveChange = async (id, checked) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        message.error(t("COMMON.NEED_PERMISSIONS")); // Yetkisiz erişim mesajı
        return;
      }

      const contact = dataSource.find(item => item._id === id);

      if (!contact) {
        message.error(t("COMMON.UNKNOWN_ERROR")); // Kişi bulunamadı mesajı
        return;
      }

      await axios.post(
        `${API_BASE_URL}/api/contacts/update`,
        {
          _id: id,
          name: contact.name,
          is_active: checked,
          tags: JSON.stringify(contact.tags),
          description: contact.description,
          image: contact.image
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      message.success(t("CATEGORIES.STATUS_UPDATED")); // Başarılı güncelleme mesajı
      fetchContacts();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleAddContact = async () => {
    try {
      const token = localStorage.getItem("token");
      const values = await form.validateFields();
  
      // Kişi adının zaten var olup olmadığını kontrol et
      const response = await axios.get(`${API_BASE_URL}/api/contacts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      const existingContact = response.data.data.find(
        contact => contact.first_name.toLowerCase() === values.first_name.toLowerCase()
      );
  
      if (existingContact) {
        message.error(
          `${values.first_name} adlı kişi zaten mevcut. Lütfen başka bir kişi adı giriniz..`
        );
        return; // Aynı kişi adı mevcutsa eklemeyi durdur
      }
  
      // FormData verilerini oluştur
      const formData = new FormData();
      formData.append("cit_number", values.cit_number); // TC Kimlik Numarası
      formData.append("first_name", values.first_name); // Ad
      formData.append("last_name", values.last_name); // Soyad
      formData.append("birth_place", values.birth_place); // Doğum Yeri
      formData.append("birth_day", values.birth_day); // Doğum Günü
      formData.append("gender", values.gender); // Cinsiyet
      formData.append("mname", values.mname); // Anne Adı
      formData.append("fname", values.fname); // Baba Adı
      formData.append("blood_group", values.blood_group); // Kan Grubu
      formData.append("education", values.education); // Eğitim
      formData.append("marital_status", values.marital_status); // Medeni Durumu
      //formData.append("dwelling_id", values.dwelling_id); // Konut ID
      formData.append("phone_number", values.phone_number); // Telefon Numarası
      formData.append("gsm", values.gsm); // GSM
      formData.append("address", values.address); // Adres
      formData.append("city", values.city); // Şehir
      formData.append("province", values.province); // İlçe
      formData.append("email", values.email); // E-posta
      formData.append("web_page", values.web_page); // Web Sayfası
      formData.append("is_active", values.is_active ? "true" : "false"); // Aktiflik
      formData.append("tags", JSON.stringify(values.tags)); // Etiketler
  
      // Açıklama alanını kontrol et ve ekle
      if (values.description !== undefined && values.description !== null && values.description.trim() !== "") {
        formData.append("description", values.description);
      } else {
        formData.append("description", ""); // Varsayılan boş bir değer ekle
      }
  
      if (fileList.length > 0) {
        formData.append("image", fileList[0]); // Görsel
      }
  
      // Kişiyi ekleme isteği
      await axios.post(`${API_BASE_URL}/api/contacts/add`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
  
      message.success(`${values.first_name} kişisi başarıyla eklendi.`);
      setAddModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchContacts();
    } catch (error) {
      handleApiError(error);
    }
  };
  

  const handleEditContact = async () => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      const values = await form.validateFields();

      formData.append("_id", editingContact._id);
      formData.append("name", values.name);
      formData.append("is_active", values.is_active ? "true" : "false");
      formData.append(
        "tags",
        JSON.stringify(values.tags) ? JSON.stringify(values.tags) : ""
      );
      formData.append(
        "description",
        values.description ? values.description : ""
      );
      if (fileList.length > 0) {
        formData.append("image", fileList[0]);
      }

      await axios.post(`${API_BASE_URL}/api/contacts/update`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      message.success(`${values.name} kişisi başarıyla güncellendi.`);
      setEditModalVisible(false);
      setEditingContact(null);
      setFileList([]);
      fetchContacts();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDeleteContacts = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/contacts/delete`,
        { ids: selectedRowKeys },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      message.success("Seçili kişiler başarıyla silindi");
      setSelectedRowKeys([]);
      fetchContacts();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleSoftDeleteContacts = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/contacts/soft-delete`,
        { ids: selectedRowKeys },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      message.success("Seçili kişiler başarıyla silindi");
      setSelectedRowKeys([]);
      fetchContacts();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleRestore = async () => {
    try {
      const token = localStorage.getItem("token");
      setLoading(true);

      await axios.post(
        `${API_BASE_URL}/api/contacts/restore`,
        { ids: selectedRowKeys },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      message.success("Kişiler başarıyla geri yüklendi");
      fetchContacts(); // Kişileri tekrar yükleyin
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
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

    doc.save("contacts.pdf");
  };

  const openPrintModal = () => {
    setPrintVisible(true);
  };

  const handlePrintModalOk = () => {
    handlePrint();
    setPrintVisible(false);
  };

  const handlePrintModalCancel = () => {
    setPrintVisible(false);
  };

  const handleColumnChange = selectedColumns => {
    setSelectedColumns(selectedColumns);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = selectedColumns.map(col => col.title);
    const tableRows = printTable.map(item =>
      selectedColumns.map(col => item[col.dataIndex])
    );

    doc.autoTable({
      head: [tableColumn],
      body: tableRows
    });

    doc.save("Kişi Listesi.pdf");
  };

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("pagination:", pagination);
    console.log("filters:", filters);
    console.log("sorter:", sorter);

    const sortedData = [...dataSource];
    if (sorter.order) {
      sortedData.sort((a, b) => {
        if (sorter.order === "ascend") {
          return a[sorter.field] > b[sorter.field] ? 1 : -1;
        } else {
          return a[sorter.field] < b[sorter.field] ? 1 : -1;
        }
      });
    }

    setDataSource(sortedData);
  };

  const handleImagePreview = imageUrl => {
    setPreviewImage(imageUrl);
    setPreviewVisible(true);
  };

  const handleCancelPreview = () => {
    setPreviewVisible(false);
    setPreviewImage("");
  };

  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Ara ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Button
          type="primary"
          onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
          icon={<SearchOutlined />}
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Ara
        </Button>
        <Button
          onClick={() => handleReset(clearFilters)}
          size="small"
          style={{ width: 90 }}
        >
          Sıfırla
        </Button>
      </div>
    ),
    filterIcon: filtered => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
        : "",
    render: text =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      )
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = clearFilters => {
    clearFilters();
    setSearchText("");
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/api/contacts/export`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          responseType: "blob" // İndirilen dosya için blob tipi
        }
      );

      // Blob'dan URL oluştur ve dosyayı indir
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `contacts_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      message.error("Lütfen bir dosya seçin");
      return;
    }

    const formData = new FormData();
    formData.append("image", file); // image alanı ile dosya ekleniyor

    try {
      const response = await axios.post(
        "http://localhost:3000/api/contacts/import",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (response.status === 201) {
        message.success("Dosya başarıyla yüklendi");
      } else {
        message.error("Dosya yükleme sırasında bir hata oluştu");
      }
    } catch (error) {
      console.error("Upload error:", error);
      message.error("Dosya yükleme sırasında bir hata oluştu");
    }
  };

  const handleUploadChange = info => {
    if (info.file.status === "done") {
      message.success(`${info.file.name} dosyası başarıyla yüklendi.`);
      fetchContacts(); // Verileri güncellemek için yeniden fetch yapabilirsiniz.
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} dosyasını yüklerken bir hata oluştu.`);
    }
  };

  const uploadProps = {
    name: "image",
    action: `${API_BASE_URL}/api/contacts/import`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    showUploadList: false,
    onChange: handleUploadChange
  };

  const handleBeforeUpload = file => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Yalnızca resim formatındaki dosyalar yüklenebilir!");
      return Upload.LIST_IGNORE;
    }
    setFileList([file]);
    return false;
  };

  const handleRemove = () => {
    setFileList([]);
  };

  const columns = [
    {
      title: "Kişi Adı",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      ...getColumnSearchProps("name"),
      responsive: ["xs", "sm", "md", "lg", "xl"],
      render: (text, record) => (
        <div>
          {record.is_active ? (
            <Tag color="green">{text}</Tag>
          ) : (
            <Tag color="volcano">{text}</Tag>
          )}
        </div>
      )
    },
    {
      title: "Durum",
      dataIndex: "is_active",
      key: "is_active",
      sorter: (a, b) => a.is_active - b.is_active,
      render: (text, record) => (
        <Switch
          checked={record.is_active}
          onChange={checked => handleActiveChange(record._id, checked)}
        />
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"]
    },
    {
      title: "Etiketler",
      dataIndex: "tags",
      key: "tags",
      render: tags =>
        tags
          ? tags.map(tag => (
              <Tag color="blue" key={tag}>
                {tag}
              </Tag>
            ))
          : null,
      responsive: ["xs", "sm", "md", "lg", "xl"]
    },
    {
      title: "Açıklama",
      dataIndex: "description",
      key: "description",
      sorter: (a, b) => {
        const descA = a.description || "";
        const descB = b.description || "";
        return descA.localeCompare(descB);
      },
      ...getColumnSearchProps("description"),
      responsive: ["xs", "sm", "md", "lg", "xl"],
      render: (text, record) => <div className="table-cell">{text}</div>
    },
    {
      title: "Oluşturulma Tarihi",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) => a.created_at.localeCompare(b.created_at),
      render: text => (
        <div className="date-cell">
          {moment(text).format("DD/MM/YYYY HH:mm")}
        </div>
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"]
    },
    {
      title: activeTab === "deleted" ? "Silinme Tarihi" : "Güncellenme Tarihi",
      dataIndex: activeTab === "deleted" ? "deleted_at" : "updated_at",
      key: activeTab === "deleted" ? "deleted_at" : "updated_at",
      sorter: (a, b) =>
        activeTab === "deleted"
          ? a.deleted_at.localeCompare(b.deleted_at)
          : a.updated_at.localeCompare(b.updated_at),
      render: text => (
        <div className="date-cell">
          {moment(text).format("DD/MM/YYYY HH:mm")}
        </div>
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"]
    },
    {
      title: "Resim",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: text => {
        if (text && text.includes("undefined")) {
          return "Resim Yok";
        } else if (text) {
          return (
            <img
              src={text}
              alt="Kişi Resmi"
              style={{ width: "70px", height: "70px", cursor: "pointer" }}
              onClick={() => handleImagePreview(text)}
            />
          );
        } else {
          return "Resim Yok";
        }
      },
      responsive: ["xs", "sm", "md", "lg", "xl"]
    },
    {
      title: "İşlemler",
      key: "actions",
      render: (text, record) => (
        <span style={{ display: "flex", gap: "4px" }}>
          {activeTab === "deleted" ? (
            <>
              <Tooltip title="Geri Yükle">
                <Button
                  icon={<RollbackOutlined />}
                  type="default"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      await axios.post(
                        `${API_BASE_URL}/api/contacts/restore`,
                        { ids: [record._id] },
                        {
                          headers: {
                            Authorization: `Bearer ${token}`
                          }
                        }
                      );
                      message.success("Kişi başarıyla geri yüklendi");
                      fetchContacts();
                    } catch (error) {
                      handleApiError(error);
                    }
                  }}
                />
              </Tooltip>
              <Tooltip title="Kalıcı Sil">
                <Popconfirm
                  title="Bu kişiyi veritabanından tamamen silmek istediğinize emin misiniz?"
                  onConfirm={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      await axios.post(
                        `${API_BASE_URL}/api/contacts/hard-delete`,
                        { ids: [record._id] },
                        {
                          headers: {
                            Authorization: `Bearer ${token}`
                          }
                        }
                      );
                      message.success("Kişi başarıyla kalıcı olarak silindi");
                      fetchContacts();
                    } catch (error) {
                      handleApiError(error);
                    }
                  }}
                  okText="Evet"
                  cancelText="Hayır"
                >
                  <Button icon={<StopOutlined />} danger />
                </Popconfirm>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Düzenle">
                <Button
                  icon={<EditOutlined />}
                  type="default"
                  onClick={() => {
                    setEditingContact(record);
                    form.setFieldsValue(record);
                    setEditModalVisible(true);
                  }}
                />
              </Tooltip>
              <Tooltip title="Sil">
                <Popconfirm
                  title="Bu kişiyi silmek istediğinize emin misiniz?"
                  onConfirm={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      await axios.post(
                        `${API_BASE_URL}/api/contacts/soft-delete`,
                        { ids: [record._id] },
                        {
                          headers: {
                            Authorization: `Bearer ${token}`
                          }
                        }
                      );
                      message.success("Kişi başarıyla silindi");
                      fetchContacts();
                    } catch (error) {
                      handleApiError(error);
                    }
                  }}
                  okText="Evet"
                  cancelText="Hayır"
                >
                  <Button icon={<DeleteOutlined />} danger />
                </Popconfirm>
              </Tooltip>
            </>
          )}
        </span>
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"]
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys
  };

  const handlePageSizeChange = (current, size) => {
    setPageSize(size);
  };

  const tabItems = [
    {
      key: "all",
      label: "Tüm Kişiler",
      children: (
        <Table
          dataSource={filteredData.filter(item => !item.deleted_at)}
          columns={columns}
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            pageSize,
            onChange: handlePageSizeChange,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50", "100"]
          }}
          scroll={{ x: "max-content" }} // Daha dinamik bir scroll genişliği sağlar
        />
      )
    },
    {
      key: "active",
      label: "Aktif Kişiler",
      children: (
        <Table
          dataSource={filteredData.filter(item => item.is_active)}
          columns={columns}
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            pageSize,
            onChange: handlePageSizeChange,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50", "100"]
          }}
          scroll={{ x: "max-content" }} // Daha dinamik bir scroll genişliği sağlar
        />
      )
    },
    {
      key: "inactive",
      label: "Pasif Kişiler",
      children: (
        <Table
          dataSource={filteredData.filter(item => !item.is_active)}
          columns={columns}
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            pageSize,
            onChange: handlePageSizeChange,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50", "100"]
          }}
          scroll={{ x: "max-content" }} // Daha dinamik bir scroll genişliği sağlar
        />
      )
    },
    // {
    //   key: "pending",
    //   label: "Bekleyen Kişiler",
    //   children: (
    //     <Table
    //       dataSource={filteredData.filter(item => item.status === "pending")}
    //       columns={columns}
    //       loading={loading}
    //       rowSelection={rowSelection}
    //       pagination={{
    //         pageSize,
    //         onChange: handlePageSizeChange,
    //         showSizeChanger: true,
    //         pageSizeOptions: ["5", "10", "20", "50", "100"]
    //       }}
    //       scroll={{ x: "max-content" }} // Daha dinamik bir scroll genişliği sağlar
    //     />
    //   )
    // },
    {
      key: "deleted",
      label: "Silinen Kişiler",
      children: (
        <Table
          dataSource={filteredData.filter(item => item.deleted_at)}
          columns={columns}
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            pageSize,
            onChange: handlePageSizeChange,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50", "100"]
          }}
          scroll={{ x: "max-content" }} // Daha dinamik bir scroll genişliği sağlar
        />
      )
    }
  ];

  return (
    <div>
      <Card style={{ marginBottom: 8 }}>
        <Row
          gutter={[16, 16]}
          style={{
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap"
          }}
        >
          <Col xs={24} sm={8} md={6} lg={4} style={{ flex: "1 1 auto" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                setAddModalVisible(true);
                setFileList([]);
              }}
              block
            >
              Kişi Ekle
            </Button>
          </Col>
          <Col xs={24} sm={8} md={6} lg={4} style={{ flex: "1 1 auto" }}>
            <Button
              type="default"
              icon={<FilePdfOutlined />}
              onClick={openPrintModal}
              block
            >
              Pdf Oluştur
            </Button>
          </Col>
          <Col xs={24} sm={8} md={6} lg={4} style={{ flex: "1 1 auto" }}>
            <Button
              type="default"
              size="middle"
              onClick={handleExport}
              icon={<FileExcelOutlined />}
              block
            >
              Excel'e Aktar
            </Button>
          </Col>
          <Col xs={24} sm={8} md={6} lg={4} style={{ flex: "1 1 auto" }}>
            <Upload {...uploadProps}>
              <Button
                type="default"
                size="middle"
                icon={<UploadOutlined />}
                block
              >
                Excel'den Al
              </Button>
            </Upload>
          </Col>

          {activeTab === "deleted" && selectedRowKeys.length > 0 && (
            <Col xs={24} sm={8} md={6} lg={4} style={{ flex: "1 1 auto" }}>
              <Popconfirm
                title="Seçili kişileri geri yüklemek istediğinizden emin misiniz?"
                onConfirm={handleRestore}
                okText="Evet"
                cancelText="Hayır"
                className="ant-popover-buttons"
              >
                <Button
                  type="primary"
                  className="custom-restore-button"
                  icon={<RollbackOutlined />}
                  block
                >
                  Seçilenleri Geri Yükle
                </Button>
              </Popconfirm>
            </Col>
          )}

          {selectedRowKeys.length > 0 && (
            <Col xs={24} sm={8} md={6} lg={4} style={{ flex: "1 1 auto" }}>
              {activeTab === "deleted" ? (
                <Popconfirm
                  title="Seçili kişileri veritabanından kalıcı olarak silmek istediğinizden emin misiniz?"
                  onConfirm={handleDeleteContacts}
                  okText="Evet"
                  cancelText="Hayır"
                  className="ant-popover-buttons"
                >
                  <Button
                    type="primary"
                    className="custom-delete-button ant-btn"
                    icon={<StopOutlined />}
                    block
                  >
                    Seçilenleri Tamamen Sil
                  </Button>
                </Popconfirm>
              ) : (
                <Popconfirm
                  title="Seçili kişileri silmek istediğinizden emin misiniz?"
                  onConfirm={handleSoftDeleteContacts}
                  okText="Evet"
                  cancelText="Hayır"
                  className="ant-popover-buttons"
                >
                  <Button
                    type="danger"
                    className="custom-delete-button ant-btn"
                    icon={<DeleteOutlined />}
                    block
                  >
                    Seçilenleri Sil
                  </Button>
                </Popconfirm>
              )}
            </Col>
          )}
        </Row>
      </Card>
      <Card style={{ marginBottom: 8 }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />
      </Card>

      <Modal
        title="Kişi Ekle"
        open={addModalVisible}
        onOk={handleAddContact}
        onCancel={() => setAddModalVisible(false)}
        okText="Kaydet"
        cancelText="Vazgeç"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Görsel" name="image">
                <Dragger
                  beforeUpload={handleBeforeUpload}
                  fileList={fileList}
                  onRemove={handleRemove}
                  accept="image/*"
                >
                  {fileList.length > 0 ? (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <img
                        src={URL.createObjectURL(fileList[0])}
                        alt="Görsel Önizleme"
                        style={{
                          marginTop: 16,
                          width: 100,
                          height: 100,
                          borderRadius: "50%",
                          objectFit: "cover"
                        }}
                      />
                    </div>
                  ) : (
                    <Button icon={<UploadOutlined />}>Görsel Yükle</Button>
                  )}
                </Dragger>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="TC Kimlik No" name="cit_number">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label="Durum"
                name="is_active"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch defaultChecked={false} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Ad"
                name="first_name"
                rules={[
                  { required: true, message: "Ad alanı doldurulmalıdır." }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Soyad"
                name="last_name"
                rules={[
                  { required: true, message: "Soyad alanı doldurulmalıdır." }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item label="Doğum Yeri" name="birth_place">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Doğum Günü" name="birth_day">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Cinsiyet"
                name="gender"
                rules={[
                  { required: true, message: "Cinsiyet alanı doldurulmalıdır." }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}></Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Anne Adı" name="mname">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Baba Adı" name="fname">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Kan Grubu" name="blood_group">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Medeni Durumu"
                name="marital_status"
                rules={[
                  {
                    required: true,
                    message: "Medeni durum alanı doldurulmalıdır."
                  }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Telefon Numarası" name="phone_number">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="GSM"
                name="gsm"
                rules={[
                  { required: true, message: "GSM alanı doldurulmalıdır." }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Adres" name="address">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Şehir" name="city">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="İlçe" name="province">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="E-posta" name="email">
                <Input type="email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Web Sayfası" name="web_page">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Etiketler" name="tags">
                <Select
                  mode="tags"
                  style={{ width: "100%" }}
                  placeholder="Etiketleri girin"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Açıklama" name="description">
                <Input.TextArea />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Kişi Düzenle"
        open={editModalVisible}
        onOk={handleEditContact}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingContact(null);
        }}
        okText="Güncelle"
        cancelText="Vazgeç"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="TC Kimlik No / Benzersiz Tanımlayıcı"
            name="cit_number"
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            label="Ad"
            name="first_name"
            rules={[{ required: true, message: "Ad alanı doldurulmalıdır." }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Soyad"
            name="last_name"
            rules={[
              { required: true, message: "Soyad alanı doldurulmalıdır." }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Doğum Yeri" name="birth_place">
            <Input />
          </Form.Item>
          <Form.Item label="Doğum Günü" name="birth_day">
            <Input />
          </Form.Item>
          <Form.Item
            label="Cinsiyet"
            name="gender"
            rules={[
              { required: true, message: "Cinsiyet alanı doldurulmalıdır." }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Anne Adı" name="mname">
            <Input />
          </Form.Item>
          <Form.Item label="Baba Adı" name="fname">
            <Input />
          </Form.Item>
          <Form.Item label="Kan Grubu" name="blood_group">
            <Input />
          </Form.Item>
          <Form.Item label="Eğitim Durumu" name="education">
            <Input />
          </Form.Item>
          <Form.Item
            label="Medeni Durum"
            name="marital_status"
            rules={[
              { required: true, message: "Medeni durum alanı doldurulmalıdır." }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Telefon Numarası" name="phone_number">
            <Input />
          </Form.Item>
          <Form.Item
            label="GSM"
            name="gsm"
            rules={[{ required: true, message: "GSM alanı doldurulmalıdır." }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Adres" name="address">
            <Input />
          </Form.Item>
          <Form.Item label="Şehir" name="city">
            <Input />
          </Form.Item>
          <Form.Item label="İlçe" name="province">
            <Input />
          </Form.Item>
          <Form.Item label="E-posta" name="email">
            <Input type="email" />
          </Form.Item>
          <Form.Item label="Web Sayfası" name="web_page">
            <Input />
          </Form.Item>
          <Form.Item label="Durum" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Etiketler" name="tags">
            <Select
              mode="tags"
              style={{ width: "100%" }}
              placeholder="Etiketleri girin"
            />
          </Form.Item>
          <Form.Item label="Açıklama" name="description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item label="Görsel" name="image">
            <Dragger
              beforeUpload={file => {
                setFileList([file]);
                return false;
              }}
              fileList={fileList}
              onRemove={() => setFileList([])}
              accept="image/*"
            >
              {fileList.length > 0 ? (
                <img
                  src={URL.createObjectURL(fileList[0])}
                  alt="Görsel Önizleme"
                  style={{ marginTop: 16, width: "100%", height: "auto" }}
                />
              ) : editingContact && editingContact.image ? (
                <img
                  src={`${API_BASE_URL}/images/${editingContact.image}`}
                  alt="Yüklü Görsel"
                  style={{ marginTop: 16, width: "100%", height: "auto" }}
                />
              ) : null}
              <Button icon={<UploadOutlined />}>Görsel Yükle / Değiştir</Button>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Yazdırma Ayarları"
        open={printVisible}
        onOk={handlePrintModalOk}
        onCancel={handlePrintModalCancel}
        okText="Pdf Oluştur"
        cancelText="Vazgeç"
      >
        <Form layout="vertical">
          <Form.Item label="Kağıt Boyutu">
            <Select value={paperSize} onChange={setPaperSize}>
              <Option value="a4">A4</Option>
              <Option value="a5">A5</Option>
              <Option value="letter">Letter</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Yönlendirme">
            <Select value={orientation} onChange={setOrientation}>
              <Option value="portrait">Dikey</Option>
              <Option value="landscape">Yatay</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Yazdırılacak Sütunlar">
            <Select
              mode="multiple"
              value={selectedColumns.map(col => col.key)}
              onChange={keys => {
                const newSelectedColumns = columns.filter(col =>
                  keys.includes(col.key)
                );
                setSelectedColumns(newSelectedColumns);
              }}
            >
              {columns.map(col => (
                <Option key={col.key} value={col.key}>
                  {col.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Resim Önizleme"
        open={previewVisible}
        footer={null}
        onCancel={handleCancelPreview}
      >
        <img
          alt="Önizleme"
          style={{ width: "100%", height: "auto" }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

export default ContactsPage;
