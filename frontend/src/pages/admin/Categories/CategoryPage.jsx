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
  Card
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
  FilePdfOutlined
} from "@ant-design/icons";
import { PaperSizeOptions, OrientationOptions } from "../constants";
import "./../admin.css";
import Highlighter from "react-highlight-words";
import { ValidateError } from "antd/lib/form/Form";
import { useForm } from "antd/lib/form/Form";

const { Option } = Select;
const { Dragger } = Upload;
const { TabPane } = Tabs;

const CategoryPage = () => {
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
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = useForm();
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingCategory) {
      setFileList([]);
    }
  }, [editingCategory]);

  useEffect(() => {
    filterData();
  }, [dataSource, activeTab]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/categories`, {
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
        setFilteredData(dataSource.filter(item => item.is_active));
        break;
      case "inactive":
        setFilteredData(dataSource.filter(item => !item.is_active));
        break;
      case "pending":
        setFilteredData(dataSource.filter(item => item.status === "pending"));
        break;
      case "deleted":
        setFilteredData(dataSource.filter(item => item.deleted_at === "null"));
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
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
        return;
      }

      const category = dataSource.find(item => item._id === id);

      if (!category) {
        message.error("Kategori bulunamadı");
        return;
      }

      await axios.post(
        `${API_BASE_URL}/api/categories/update`,
        {
          _id: id,
          name: category.name,
          is_active: checked,
          tags: JSON.stringify(category.tags),
          description: category.description,
          image: category.image
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      message.success("Kategori durumu başarıyla güncellendi");
      fetchCategories();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleAddCategory = async () => {
    try {
      const token = localStorage.getItem("token");
      const values = await form.validateFields();

      // Kategori adının zaten var olup olmadığını kontrol et
      const response = await axios.get(`${API_BASE_URL}/api/categories`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const existingCategory = response.data.data.find(
        category => category.name.toLowerCase() === values.name.toLowerCase()
      );

      if (existingCategory) {
        message.error(
          `${values.name} adlı kategori zaten mevcut. Lütfen başka bir kategori adı giriniz..`
        );
        return; // Aynı kategori adı mevcutsa eklemeyi durdur
      }
      //formdata verilerini oluştur
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("is_active", values.is_active ? "true" : "false");
      formData.append("tags", JSON.stringify(values.tags));
      // Açıklama alanını kontrol et ve ekle
      if (
        values.description !== undefined &&
        values.description !== null &&
        values.description.trim() !== ""
      ) {
        formData.append("description", values.description);
      } else {
        // formData.append("description", ""); // Varsayılan boş bir değer ekle
        formData.append("description", ""); // Açıklama alanı boşsa hiçbir şey ekleme
      }
      if (fileList.length > 0) {
        formData.append("image", fileList[0]);
      }

      await axios.post(`${API_BASE_URL}/api/categories/add`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      message.success(`${values.name} kategorisi başarıyla eklendi.`);
      setAddModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchCategories();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleEditCategory = async () => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      const values = await form.validateFields();

      formData.append("_id", editingCategory._id);
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

      await axios.post(`${API_BASE_URL}/api/categories/update`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      message.success(`${values.name} kategorisi başarıyla güncellendi.`);
      setEditModalVisible(false);
      setEditingCategory(null);
      setFileList([]);
      fetchCategories();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDeleteCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/categories/delete`,
        { ids: selectedRowKeys },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      message.success("Seçili kategoriler başarıyla silindi");
      setSelectedRowKeys([]);
      fetchCategories();
    } catch (error) {
      handleApiError(error);
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

    doc.save("categories.pdf");
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

    doc.save("Kategori Listesi.pdf");
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
        `${API_BASE_URL}/api/categories/export`,
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
      link.setAttribute("download", `categories_${Date.now()}.xlsx`);
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
        "http://localhost:3000/api/categories/import",
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
      fetchCategories(); // Verileri güncellemek için yeniden fetch yapabilirsiniz.
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} dosyasını yüklerken bir hata oluştu.`);
    }
  };

  const uploadProps = {
    name: "image",
    action: `${API_BASE_URL}/api/categories/import`,
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
      title: "Kategori Adı",
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
      render: (text, record) => (
        <div className="table-cell">{text}</div>
      )
    },
    {
      title: "Oluşturulma Tarihi",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) => a.created_at.localeCompare(b.created_at),
      render: text => <div className="date-cell">{moment(text).format("DD/MM/YYYY HH:mm")}</div>,
      responsive: ["xs", "sm", "md", "lg", "xl"]
    },
    {
      title: "Güncellenme Tarihi",
      dataIndex: "updated_at",
      key: "updated_at",
      sorter: (a, b) => a.updated_at.localeCompare(b.updated_at),
      render: text => <div className="date-cell">{moment(text).format("DD/MM/YYYY HH:mm")}</div>,
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
              alt="Kategori Resmi"
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
          <Button
            icon={<EditOutlined />}
            type="default"
            onClick={() => {
              setEditingCategory(record);
              form.setFieldsValue(record);
              setEditModalVisible(true);
            }}
          />
          <Popconfirm
            title="Bu kategoriyi silmek istediğinize emin misiniz?"
            onConfirm={async () => {
              try {
                const token = localStorage.getItem("token");
                await axios.post(
                  `${API_BASE_URL}/api/categories/delete`,
                  { ids: [record._id] },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                  }
                );
                message.success("Kategori başarıyla silindi");
                fetchCategories();
              } catch (error) {
                handleApiError(error);
              }
            }}
            okText="Evet"
            cancelText="Hayır"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
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
      label: "Tüm Kategoriler",
      children: (
        <Table
          dataSource={filteredData}
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
      label: "Aktif Kategoriler",
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
      label: "Pasif Kategoriler",
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
    //   label: "Bekleyen Kategoriler",
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
      label: "Silinen Kategoriler",
      children: (
        <Table
          dataSource={filteredData.filter(item => item.deleted_at === "null")}
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
              Kategori Ekle
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
          {selectedRowKeys.length > 0 && (
            <Col xs={24} sm={8} md={6} lg={4} style={{ flex: "1 1 auto" }}>
              <Popconfirm
                title="Seçili kategorileri silmek istediğinizden emin misiniz?"
                onConfirm={handleDeleteCategories}
                okText="Evet"
                cancelText="Hayır"
              >
                <Button type="danger" icon={<DeleteOutlined />} block>
                  Seçilenleri Sil
                </Button>
              </Popconfirm>
            </Col>
          )}
          <Col xs={24} sm={8} md={6} lg={4} style={{ flex: "1 1 auto" }}>
          <Dropdown overlay={menu} trigger={['click']}>
            <Button icon={<SettingOutlined />} block>
              Ayarlar
            </Button>
          </Dropdown>
        </Col>
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
        title="Kategori Ekle"
        open={addModalVisible}
        onOk={handleAddCategory}
        onCancel={() => setAddModalVisible(false)}
        okText="Kaydet"
        cancelText="Vazgeç"
        width={400}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Kategori Adı"
            name="name"
            rules={[
              { required: true, message: "Kategori adı alanı doldurulmalıdır." }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Durum"
            name="is_active"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch defaultChecked={false} />
          </Form.Item>
          <Form.Item
            label="Etiketler"
            name="tags"
            rules={[
              { required: true, message: "Etiketler alanı doldurulmalıdır." }
            ]}
          >
            <Select
              mode="tags"
              style={{ width: "100%" }}
              placeholder="Etiketleri girin"
            />
          </Form.Item>
          <Form.Item label="Açıklama" name="description">
            <Input.TextArea />
          </Form.Item>
          {/* <Form.Item label="Görsel" name="image">
            <Dragger
              beforeUpload={file => {
                setFileList([file]);
                return false;
              }}
              fileList={fileList}
              onRemove={() => setFileList([])}
            >
              {fileList.length > 0 && (
                <img
                  src={URL.createObjectURL(fileList[0])}
                  alt="Görsel Önizleme"
                  style={{ marginTop: 16, width: "100%", height: "auto" }}
                />
              )}
              <Button icon={<UploadOutlined />}>Görsel Yükle</Button>
            </Dragger>
          </Form.Item> */}
          <Form.Item label="Görsel" name="image">
            <Dragger
              beforeUpload={handleBeforeUpload}
              fileList={fileList}
              onRemove={handleRemove}
              accept="image/*" // Sadece resim dosyalarının seçilmesine izin verir
            >
              {fileList.length > 0 && (
                <img
                  src={URL.createObjectURL(fileList[0])}
                  alt="Görsel Önizleme"
                  style={{ marginTop: 16, width: "100%", height: "auto" }}
                />
              )}
              <Button icon={<UploadOutlined />}>Görsel Yükle</Button>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Kategori Düzenle"
        open={editModalVisible}
        onOk={handleEditCategory}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingCategory(null);
        }}
        okText="Güncelle"
        cancelText="Vazgeç"
        width={400}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Kategori Adı"
            name="name"
            rules={[
              { required: true, message: "Kategori adı doldurulmalıdır." }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Durum" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            label="Etiketler"
            name="tags"
            rules={[
              { required: true, message: "Etiketler alanı doldurulmalıdır." }
            ]}
          >
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
              accept="image/*" // Sadece resim dosyalarının seçilmesine izin verir
            >
              {fileList.length > 0 ? (
                <img
                  src={URL.createObjectURL(fileList[0])}
                  alt="Görsel Önizleme"
                  style={{ marginTop: 16, width: "100%", height: "auto" }}
                />
              ) : editingCategory && editingCategory.image ? (
                <img
                  src={`${API_BASE_URL}/images/${editingCategory.image}`}
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

export default CategoryPage;
