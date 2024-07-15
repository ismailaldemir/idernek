import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  message,
  Modal,
  Checkbox,
  Select,
  Switch,
  Upload,
  Form,
  Input,
  Popconfirm
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
  EditOutlined
} from "@ant-design/icons";
import { PaperSizeOptions, OrientationOptions } from "../constants";
import Highlighter from "react-highlight-words";

import { useForm } from "antd/lib/form/Form";
const { Option } = Select;
const { Dragger } = Upload;

const CategoryPage = () => {
  const [dataSource, setDataSource] = useState([]);
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

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/api/categories", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const formattedData = response.data.data.map(item => ({
        ...item,
        key: item._id,
        imageUrl: `http://localhost:3000/api/tmp/${item.image}`
      }));

      setDataSource(formattedData);
      setPrintTable(formattedData);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = error => {
    console.error("API hatası:", error);
    if (error.response && error.response.status === 401) {
      message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın..");
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
        "http://localhost:3000/api/categories/update",
        { _id: id, name: category.name, is_active: checked },
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

  // const handleAddCategory = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const formData = new FormData();
  //     const values = await form.validateFields();

  //     formData.append("name", values.name);
  //     formData.append("is_active", values.is_active ? "true" : "false");
  //     if (fileList.length > 0) {
  //       formData.append("image", fileList[0]);
  //     }

  //     await axios.post("http://localhost:3000/api/categories/add", formData, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "multipart/form-data"
  //       }
  //     });

  //     message.success(`${values.name} kategorisi başarıyla eklendi.`);
  //     setAddModalVisible(false);
  //     form.resetFields();
  //     setFileList([]);
  //     fetchCategories();
  //   } catch (error) {
  //     handleApiError(error);
  //   }
  // };

  const handleAddCategory = async () => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      const values = await form.validateFields();
  
      // Kategori adının zaten var olup olmadığını kontrol et
      const response = await axios.get("http://localhost:3000/api/categories", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      const existingCategory = response.data.data.find(
        category => category.name.toLowerCase() === values.name.toLowerCase()
      );

      if (existingCategory) {
        message.error(`${values.name} adlı kategori zaten mevcut. Lütfen başka bir kategori adı giriniz..`);
        return; // Aynı kategori adı mevcutsa eklemeyi durdur
      }
  
      formData.append("name", values.name);
      formData.append("is_active", values.is_active ? "true" : "false");
      if (fileList.length > 0) {
        formData.append("image", fileList[0]);
      }
  
      await axios.post("http://localhost:3000/api/categories/add", formData, {
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
      if (fileList.length > 0) {
        formData.append("image", fileList[0]);
      }

      await axios.post(
        "http://localhost:3000/api/categories/update",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

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
        "http://localhost:3000/api/categories/delete",
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

  const columns = [
    {
      title: "Kategori Adı",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      ...getColumnSearchProps("name")
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
      )
    },
    {
      title: "Oluşturulma Tarihi",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) => a.created_at.localeCompare(b.created_at),
      render: text => moment(text).format("DD/MM/YYYY HH:mm")
    },
    {
      title: "Güncellenme Tarihi",
      dataIndex: "updated_at",
      key: "updated_at",
      sorter: (a, b) => a.updated_at.localeCompare(b.updated_at),
      render: text => moment(text).format("DD/MM/YYYY HH:mm")
    },
    {
      title: "İşlemler",
      key: "actions",
      render: (text, record) => (
        <Button
          icon={<EditOutlined />}
          type="primary"
          onClick={() => {
            setEditingCategory(record);
            form.setFieldsValue(record);
            setEditModalVisible(true);
          }}
        >
          Düzenle
        </Button>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys
  };

  const handlePageSizeChange = (current, size) => {
    setPageSize(size);
  };

  return (
    <div>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          form.resetFields();
          setAddModalVisible(true);
          setFileList([]);
        }}
        style={{ marginBottom: 16 }}
      >
        Yeni Kategori
      </Button>
      <Popconfirm
        title="Seçili kategorileri silmek istediğinizden emin misiniz?"
        onConfirm={handleDeleteCategories}
        okText="Evet"
        cancelText="Hayır"
      >
        <Button
          type="danger"
          icon={<DeleteOutlined />}
          disabled={!selectedRowKeys.length}
          style={{ marginBottom: 16, marginLeft: 8 }}
        >
          Seçilenleri Sil
        </Button>
      </Popconfirm>
      <Table
        dataSource={dataSource}
        columns={columns}
        loading={loading}
        rowSelection={rowSelection}
        pagination={{
          pageSize,
          onChange: handlePageSizeChange,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50", "100"]
        }}
      />

      <Modal
        title="Yeni Kategori"
        open={addModalVisible}
        onOk={handleAddCategory}
        onCancel={() => setAddModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Kategori Adı"
            name="name"
            rules={[{ required: true, message: "Kategori adı alanı doldurulmalıdır." }]}
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
          <Form.Item label="Görsel" name="image">
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
          <Form.Item label="Görsel" name="image">
            <Dragger
              beforeUpload={file => {
                setFileList([file]);
                return false;
              }}
              fileList={fileList}
              onRemove={() => setFileList([])}
            >
              <Button icon={<UploadOutlined />}>Görsel Yükle</Button>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryPage;
