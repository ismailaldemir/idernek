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
  Tabs
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
import "./CategoryPage.css";
import Highlighter from "react-highlight-words";
import { useForm } from "antd/lib/form/Form";

const { Option } = Select;
const { Dragger } = Upload;

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
        setFilteredData(dataSource.filter(item => item.status === "deleted"));
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
      message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
      window.location.href = "/login";
    } else {
      message.error("İşlem gerçekleştirilemedi.");
    }
  };

  const handleActiveChange = async (id, checked) => {
    try {
      const token = localStorage.getItem("token");
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
          `${values.name} adlı kategori zaten mevcut. Lütfen başka bir kategori adı giriniz.`
        );
        return;
      }

      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("is_active", values.is_active ? "true" : "false");
      formData.append("tags", JSON.stringify(values.tags));
      if (
        values.description !== undefined &&
        values.description !== null &&
        values.description.trim() !== ""
      ) {
        formData.append("description", values.description);
      } else {
        formData.append("description", "");
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

    doc.autoTable(tableColumn, tableRows, { startY: 20 });
    doc.save("categories.pdf");
  };

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = clearFilters => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Ara ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
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
        <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
          Temizle
        </Button>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
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

  const columns = [
    {
      title: "Kategori Adı",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
      render: (text, record) => (
        <span>
          {record.is_active ? <Tag color="green">{text}</Tag> : <Tag color="volcano">{text}</Tag>}
        </span>
      )
    },
    {
      title: "Durum",
      dataIndex: "is_active",
      key: "is_active",
      render: (text, record) => (
        <Switch
          checked={record.is_active}
          onChange={checked => handleActiveChange(record._id, checked)}
        />
      )
    },
    {
      title: "Etiketler",
      dataIndex: "tags",
      key: "tags",
      render: tags => (
        <>
          {tags.map(tag => (
            <Tag color="blue" key={tag}>
              {tag}
            </Tag>
          ))}
        </>
      )
    },
    {
      title: "Açıklama",
      dataIndex: "description",
      key: "description"
    },
    {
      title: "Resim",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (text, record) => (
        <img
          src={`${API_BASE_URL}/api/public/images/${record.image}`}
          alt={record.name}
          style={{ width: "50px", height: "50px" }}
        />
      )
    },
    {
      title: "İşlemler",
      key: "action",
      render: (text, record) => (
        <span>
          <Button
            icon={<EditOutlined />}
            style={{ marginRight: 8 }}
            onClick={() => {
              setEditingCategory(record);
              setEditModalVisible(true);
              form.setFieldsValue(record);
              setPreviewImage(record.imageUrl);
            }}
          />
          <Popconfirm
            title="Emin misiniz?"
            onConfirm={() => handleDeleteCategories([record._id])}
          >
            <Button icon={<DeleteOutlined />} type="danger" />
          </Popconfirm>
        </span>
      )
    }
  ];

  const tabItems = [
    {
      key: "all",
      label: "Tüm Kategoriler",
      children: <Table
        dataSource={filteredData}
        columns={columns}
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: selectedKeys => setSelectedRowKeys(selectedKeys)
        }}
        pagination={{
          pageSize,
          onChange: page => {
            setPageSize(page);
          }
        }}
      />,
    },
    {
      key: "active",
      label: "Aktif Kategoriler",
      children: <Table
        dataSource={filteredData.filter(item => item.is_active)}
        columns={columns}
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: selectedKeys => setSelectedRowKeys(selectedKeys)
        }}
        pagination={{
          pageSize,
          onChange: page => {
            setPageSize(page);
          }
        }}
      />,
    },
    {
      key: "inactive",
      label: "Pasif Kategoriler",
      children: <Table
        dataSource={filteredData.filter(item => !item.is_active)}
        columns={columns}
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: selectedKeys => setSelectedRowKeys(selectedKeys)
        }}
        pagination={{
          pageSize,
          onChange: page => {
            setPageSize(page);
          }
        }}
      />,
    },
    {
      key: "pending",
      label: "Bekleyen Kategoriler",
      children: <Table
        dataSource={filteredData.filter(item => item.status === "pending")}
        columns={columns}
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: selectedKeys => setSelectedRowKeys(selectedKeys)
        }}
        pagination={{
          pageSize,
          onChange: page => {
            setPageSize(page);
          }
        }}
      />,
    },
    {
      key: "deleted",
      label: "Silinen Kategoriler",
      children: <Table
        dataSource={filteredData.filter(item => item.status === "deleted")}
        columns={columns}
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: selectedKeys => setSelectedRowKeys(selectedKeys)
        }}
        pagination={{
          pageSize,
          onChange: page => {
            setPageSize(page);
          }
        }}
      />,
    }
  ];

  return (
    <div>
      <Row style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalVisible(true)}
          >
            Yeni Kategori
          </Button>
        </Col>
        <Col span={12} style={{ textAlign: "right" }}>
          <Button
            type="danger"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCategories(selectedRowKeys)}
            disabled={selectedRowKeys.length === 0}
          >
            Seçilenleri Sil
          </Button>
        </Col>
      </Row>
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
      <Modal
        title="Kategori Ekle"
        visible={addModalVisible}
        onOk={handleAddCategory}
        onCancel={() => {
          setAddModalVisible(false);
          form.resetFields();
        }}
        okText="Ekle"
        cancelText="İptal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Kategori Adı"
            rules={[{ required: true, message: "Lütfen kategori adını girin" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="is_active" valuePropName="checked">
            <Checkbox>Aktif</Checkbox>
          </Form.Item>
          <Form.Item name="tags" label="Etiketler">
            <Select mode="tags" style={{ width: "100%" }} placeholder="Etiket ekle">
              {[]}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Açıklama">
            <Input.TextArea />
          </Form.Item>
          <Form.Item label="Resim">
            <Upload
              listType="picture"
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
            >
              <Button icon={<UploadOutlined />}>Resim Yükle</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Kategori Düzenle"
        visible={editModalVisible}
        onOk={handleEditCategory}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingCategory(null);
          setFileList([]);
        }}
        okText="Güncelle"
        cancelText="İptal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Kategori Adı"
            rules={[{ required: true, message: "Lütfen kategori adını girin" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="is_active" valuePropName="checked">
            <Checkbox>Aktif</Checkbox>
          </Form.Item>
          <Form.Item name="tags" label="Etiketler">
            <Select mode="tags" style={{ width: "100%" }} placeholder="Etiket ekle">
              {[]}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Açıklama">
            <Input.TextArea />
          </Form.Item>
          <Form.Item label="Resim">
            <Upload
              listType="picture"
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
            >
              <Button icon={<UploadOutlined />}>Resim Yükle</Button>
            </Upload>
          </Form.Item>
          {previewImage && (
            <Form.Item label="Mevcut Resim">
              <img src={previewImage} alt="Preview" style={{ width: "50px", height: "50px" }} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryPage;
