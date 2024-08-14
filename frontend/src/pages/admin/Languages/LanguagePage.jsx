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
  StopOutlined
} from "@ant-design/icons";
import { PaperSizeOptions, OrientationOptions } from "../constants";
import "./../admin.css";
import Highlighter from "react-highlight-words";
import { ValidateError } from "antd/lib/form/Form";
import { useForm } from "antd/lib/form/Form";
import i18n from "../../../i18n";
import { useTranslation } from "react-i18next";
import {
  addEntity,
  editEntity,
  deleteEntity,
  softDeleteEntity,
  restoreEntity,
  printEntity,
  fetchData,
  updateStatus,
  exportData,
  uploadFile
} from "../../../utils/apiHelpers";
import { apiService } from "../../../services/apiService";
import {
  entityFields,
  prepareEntityValues
} from "../../../constants/entityFields";
import handleApiError from "../../../utils/handleApiError";
import { getColumnSearchProps } from "../../../utils/searchEntity";
import languageNames, { getFlagPath } from "../../../constants/languages.js";
import fs from "fs";
import path from "path";

const { Option } = Select;
const { Dragger } = Upload;
const { TabPane } = Tabs;

const LanguagePage = () => {
  const [form] = Form.useForm();
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
  const [editingData, seteditingData] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const { t } = useTranslation();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingData) {
      setFileList([]);
    }
  }, [editingData]);

  useEffect(() => {
    filterData();
  }, [dataSource, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/languages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = response.data.data || [];

      if (data.length === 0) {
        console.info("Veri bulunamadı");
      }

      const formattedData = data.map(item => ({
        ...item,
        key: item._id
      }));

      setDataSource(formattedData);
      setPrintTable(formattedData);
      filterData();
    } catch (error) {
      handleApiError(error, t);
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
      // case "pending":
      //   setFilteredData(
      //     dataSource.filter(
      //       item => item.status === "pending" && !item.deleted_at
      //     )
      //   );
      //   break;
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

  const handleActiveChange = async (id, checked) => {
    const data = { is_active: checked /* diğer alanlar */ };
    await updateStatus("languages", id, data, fetchData, t);
  };

  const handleAddData = async () => {
    try {
      const values = await form.validateFields();
      console.log(values); // Gönderilen form verilerini kontrol et

      // Genel değerleri hazırlama
      const modifiedValues = prepareEntityValues("languages", values); //formdan gelen verilere göre kontrol edilmesi gereken değerleri kontrol edip hazırlayan fonksiyon
      console.log("Modified Values After Preparation:", modifiedValues); // Hazırlanan verileri kontrol et

      await addEntity(
        "languages",
        modifiedValues,
        fileList,
        fetchData,
        setAddModalVisible,
        t,
        form
      );

      form.resetFields();
      setFileList([]);
    } catch (error) {
      console.log("Hata nesnesi:", error);

      if (error.errorFields && error.errorFields.length > 0) {
        const firstErrorField = error.errorFields[0].name[0];
        form.scrollToField(firstErrorField);
        form.getFieldInstance(firstErrorField).focus();
      } else {
        message.error(t("common:COMMON.ERROR"));
      }
    }
  };

  const handleEditData = async () => {
    try {
      // Formun alanlarını doğrula
      const values = await form.validateFields();

      await editEntity(
        "languages",
        form,
        fileList,
        fetchData,
        setEditModalVisible,
        editingData,
        t
      );

      seteditingData(null);
      setFileList([]);
    } catch (error) {
      console.log("Hata nesnesi:", error); // Hata nesnesini inceleme

      if (error.errorFields) {
        error.errorFields.forEach(field => {
          const fieldName = field.name[0];
          form.scrollToField(fieldName); // Hatalı alanlara odaklanma
          form.getFieldInstance(fieldName).focus(); // Hatalı alana odaklanma
        });
        // Alanlar boş olduğunda kullanıcıyı bilgilendir
        // message.error(t("common:ERRORS.VALIDATION_FAILED")); // Özelleştirilmiş hata mesajı
      } else {
        // Diğer hatalar için genel bir mesaj göster
        message.error(t("common:COMMON.ERROR"));
      }

      if (error.errorFields) {
        // Hatalı alanlara odaklanma
        const firstErrorField = error.errorFields[0].name[0]; // İlk hatalı alan
        form.scrollToField(firstErrorField); // Hatalı alana kaydırma
        form.getFieldInstance(firstErrorField).focus(); // Hatalı alana odaklanma
      }

      // Özelleştirilmiş hata mesajı gösterme
      // message.error(t("common:COMMON.VALIDATION_FAILED"));
    }
  };

  const handleDeleteData = async () => {
    await deleteEntity("languages", selectedRowKeys, fetchData, t);
    setSelectedRowKeys([]);
  };

  const handleSoftDeleteData = async () => {
    await softDeleteEntity("languages", selectedRowKeys, fetchData, t);
    setSelectedRowKeys([]);
  };

  const handleRestore = async () => {
    setLoading(true);
    await restoreEntity("languages", selectedRowKeys, fetchData, t);
    setLoading(false);
  };

  const handlePrint = () => {
    printEntity(
      "languages",
      selectedColumns,
      printTable,
      orientation,
      paperSize
    );
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
    await exportData("languages", setLoading, t);
  };

  const handleUpload = async () => {
    await uploadFile("languages", file, t);
  };

  const handleUploadChange = info => {
    if (info.file.status === "done") {
      message.success(
        t("common:COMMON.UPLOAD_SUCCESS", { fileName: info.file.name })
      );
      fetchData();
    } else if (info.file.status === "error") {
      message.error(
        t("common:COMMON.UPLOAD_ERROR", { fileName: info.file.name })
      );
    }
  };

  const uploadProps = {
    name: "image",
    action: `${API_BASE_URL}/api/languages/import`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    showUploadList: false,
    onChange: handleUploadChange
  };

  const handleBeforeUpload = file => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error(t("common:COMMON.ONLY_IMAGES_ALLOWED"));
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
      title: t("COLUMNS.TITLE"),
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      ...getColumnSearchProps(
        "name",
        searchedColumn,
        setSearchedColumn,
        searchText,
        setSearchText,
        handleSearch,
        handleReset,
        t
      ),
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
      title: t("COLUMNS.STATUS"),
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
      title: t("COLUMNS.TAGS"),
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
      title: t("COLUMNS.DESCRIPTION"),
      dataIndex: "description",
      key: "description",
      sorter: (a, b) => {
        const descA = a.description || "";
        const descB = b.description || "";
        return descA.localeCompare(descB);
      },
      ...getColumnSearchProps(
        "description",
        searchedColumn,
        setSearchedColumn,
        searchText,
        setSearchText,
        handleSearch,
        handleReset,
        t
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"],
      render: (text, record) => <div className="table-cell">{text}</div>
    },
    {
      title: t("COLUMNS.CREATED_AT"),
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
      title:
        activeTab === "deleted"
          ? t("COLUMNS.DELETED_AT")
          : t("COLUMNS.UPDATED_AT"),
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
      title: t("COLUMNS.IMAGE"),
      dataIndex: "image",
      key: "image",
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
      title: t("COLUMNS.ACTIONS"),
      key: "actions",
      render: (text, record) => (
        <span style={{ display: "flex", gap: "4px" }}>
          {activeTab === "deleted" ? (
            <>
              <Tooltip title={t("TOOLTIP.RESTORE")}>
                <Popconfirm
                  title={t("common:COMMON.CONFIRM_RESTORE")}
                  onConfirm={async () => {
                    await restoreEntity(
                      "languages",
                      [record._id],
                      fetchData,
                      t
                    );
                  }}
                  okText={t("common:COMMON.CONFIRM_YES")}
                  cancelText={t("common:COMMON.CONFIRM_NO")}
                >
                  <Button icon={<RollbackOutlined />} type="default" />
                </Popconfirm>
              </Tooltip>

              <Tooltip title={t("TOOLTIP.DELETE")}>
                <Popconfirm
                  title={t("common:COMMON.CONFIRM_DELETE")}
                  onConfirm={async () => {
                    await deleteEntity("languages", [record._id], fetchData, t);
                  }}
                  okText={t("common:COMMON.CONFIRM_YES")}
                  cancelText={t("common:COMMON.CONFIRM_NO")}
                >
                  <Button icon={<StopOutlined />} danger />
                </Popconfirm>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title={t("TOOLTIP.EDIT")}>
                <Button
                  icon={<EditOutlined />}
                  type="default"
                  onClick={() => {
                    seteditingData(record);
                    form.setFieldsValue(record);
                    setEditModalVisible(true);
                  }}
                />
              </Tooltip>
              <Tooltip title={t("TOOLTIP.DELETE")}>
                <Popconfirm
                  title={t("common:COMMON.CONFIRM_SOFT_DELETE")}
                  onConfirm={async () => {
                    await softDeleteEntity(
                      "languages",
                      [record._id],
                      fetchData,
                      t
                    );
                  }}
                  okText={t("common:COMMON.CONFIRM_YES")}
                  cancelText={t("common:COMMON.CONFIRM_NO")}
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
      label: t("common:TABS.ALL_RECORDS"),
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
      label: t("common:TABS.ACTIVE_RECORDS"),
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
      label: t("common:TABS.INACTIVE_RECORDS"),
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
      label: t("common:TABS.DELETED_RECORDS"),
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
    //butonlar
    <div>
      <Card style={{ marginBottom: 2 }}>
        <Row
          gutter={[16, 16]}
          style={{
            marginBottom: 4,
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
              {t("common:BUTTONS.NEW_RECORD")} {/* yeni kayıt ekle butonu */}
            </Button>
          </Col>
          <Col xs={24} sm={8} md={6} lg={4} style={{ flex: "1 1 auto" }}>
            <Button
              type="default"
              icon={<FilePdfOutlined />}
              onClick={openPrintModal}
              block
            >
              {t("common:BUTTONS.CREATE_PDF")} {/* pdf oluştur butonu */}
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
              {t("common:BUTTONS.CREATE_EXCEL")} {/* excele aktar butonu */}
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
                {t("common:BUTTONS.IMPORT_EXCEL")} {/* excelden al */}
              </Button>
            </Upload>
          </Col>

          {activeTab === "deleted" && selectedRowKeys.length > 0 && (
            <Col xs={24} sm={8} md={6} lg={4} style={{ flex: "1 1 auto" }}>
              <Popconfirm
                title={t("common:COMMON.CONFIRM_RESTORE")}
                onConfirm={handleRestore}
                okText={t("common:COMMON.CONFIRM_YES")}
                cancelText={t("common:COMMON.CONFIRM_NO")}
                className="ant-popover-buttons"
              >
                <Button
                  type="primary"
                  className="custom-restore-button"
                  icon={<RollbackOutlined />}
                  block
                >
                  {t("BUTTONS.RESTORE_SELECTED_RECORDS")}
                </Button>
              </Popconfirm>
            </Col>
          )}

          {selectedRowKeys.length > 0 && (
            <Col xs={24} sm={8} md={6} lg={4} style={{ flex: "1 1 auto" }}>
              {activeTab === "deleted" ? (
                <Popconfirm
                  title={t("common:COMMON.CONFIRM_DELETE")}
                  onConfirm={handleDeleteData}
                  okText={t("common:COMMON.CONFIRM_YES")}
                  cancelText={t("common:COMMON.CONFIRM_NO")}
                  className="ant-popover-buttons"
                >
                  <Button
                    type="primary"
                    className="custom-delete-button ant-btn"
                    icon={<StopOutlined />}
                    block
                  >
                    {t("BUTTONS.DELETE_SELECTED_RECORDS")}
                  </Button>
                </Popconfirm>
              ) : (
                <Popconfirm
                  title={t("common:COMMON.CONFIRM_SOFT_DELETE")}
                  onConfirm={handleSoftDeleteData}
                  okText={t("common:COMMON.CONFIRM_YES")}
                  cancelText={t("common:COMMON.CONFIRM_NO")}
                  className="ant-popover-buttons"
                >
                  <Button
                    type="danger"
                    className="custom-delete-button ant-btn"
                    icon={<DeleteOutlined />}
                    block
                  >
                    {t("common:BUTTONS.DELETE_SELECTED_RECORDS")}
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
        title={t("admin:LANGUAGES.ADD_MODAL_TITLE")} // Veri ekle modal form
        open={addModalVisible}
        onOk={handleAddData}
        onCancel={() => setAddModalVisible(false)}
        okText={t("common:BUTTONS.SAVE")}
        cancelText={t("common:BUTTONS.CANCEL")}
        width={400}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t("admin:LANGUAGES.SELECT_LANGUAGE")}
            name="lang"
            rules={[
              {
                required: true,
                message: t("admin:LANGUAGES.SELECT_LANGUAGE_MUST_BE_FILLED")
              }
            ]}
          >
            <Select placeholder={t("common:PLACEHOLDER.SELECT_LANGUAGE")}>
              {Object.keys(languageNames) // languages.js dosyasındaki dilleri al
                .filter(lng => lng in languageNames) // Sadece tanımlı diller
                .map(lng => (
                  <Option key={lng} value={lng}>
                    <img
                      src={getFlagPath(lng)} // Bayrak görselini al
                      alt={`${languageNames[lng]} bayrağı`} // Alt metin
                      style={{ width: "20px", marginRight: "8px" }} // Stil ayarları
                    />
                    {languageNames[lng]} {/* Dil ismi */}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t("admin:LANGUAGES.TITLE")}
            name="name"
            rules={[
              {
                required: true,
                message: t("admin:LANGUAGES.TITLE_MUST_BE_FILLED")
              }
            ]}
          >
            <Input placeholder={t("common:PLACEHOLDER.TITLE")} />
          </Form.Item>

          <Form.Item
            label={t("common:COLUMNS.STATUS")}
            name="is_active"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch defaultChecked={false} />
          </Form.Item>

          <Form.Item
            label={t("common:COLUMNS.TAGS")}
            name="tags"
            rules={[
              {
                required: true,
                message: t("admin:LANGUAGES.TAGS_MUST_BE_FILLED")
              }
            ]}
          >
            <Select
              mode="tags"
              style={{ width: "100%" }}
              placeholder={t("common:PLACEHOLDER.TAGS")}
            />
          </Form.Item>

          <Form.Item label={t("common:COLUMNS.DESCRIPTION")} name="description">
            <Input.TextArea />
          </Form.Item>

          <Form.Item label={t("common:COLUMNS.IMAGE")} name="image">
            <Dragger
              beforeUpload={file => {
                setFileList([file]);
                return false;
              }}
              fileList={fileList}
              onRemove={() => setFileList([])}
              accept="image/*"
            >
              {fileList.length > 0 && (
                <img
                  src={URL.createObjectURL(fileList[0])}
                  alt="Görsel Önizleme"
                  style={{ marginTop: 16, width: "100%", height: "auto" }}
                />
              )}
              <Button icon={<UploadOutlined />}>
                {t("common:BUTTONS.UPLOAD_IMAGE")}
              </Button>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t("admin:LANGUAGES.EDIT_MODAL_TITLE")} //Veri düzenle modal form
        open={editModalVisible}
        onOk={handleEditData}
        onCancel={() => {
          setEditModalVisible(false);
          seteditingData(null);
        }}
        okText={t("common:BUTTONS.EDIT")}
        cancelText={t("common:BUTTONS.CANCEL")}
        width={400}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t("admin:LANGUAGES.SELECT_LANGUAGE")}
            name="lang"
            rules={[
              {
                required: true,
                message: t("admin:LANGUAGES.SELECT_LANGUAGE_MUST_BE_FILLED")
              }
            ]}
          >
            <Select placeholder={t("common:PLACEHOLDER.SELECT_LANGUAGE")}>
              {Object.keys(languageNames) // languages.js dosyasındaki dilleri al
                .filter(lng => lng in languageNames) // Sadece tanımlı diller
                .map(lng => (
                  <Option key={lng} value={lng}>
                    <img
                      src={getFlagPath(lng)} // Bayrak görselini al
                      alt={`${languageNames[lng]} bayrağı`} // Alt metin
                      style={{ width: "20px", marginRight: "8px" }} // Stil ayarları
                    />
                    {languageNames[lng]} {/* Dil ismi */}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t("admin:LANGUAGES.TITLE")}
            name="name"
            rules={[
              {
                required: true,
                message: t("admin:LANGUAGES.TITLE_MUST_BE_FILLED")
              }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t("common:COLUMNS.STATUS")}
            name="is_active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label={t("common:COLUMNS.TAGS")}
            name="tags"
            rules={[
              {
                required: true,
                message: t("admin:LANGUAGES.TAGS_MUST_BE_FILLED")
              }
            ]}
          >
            <Select
              mode="tags"
              style={{ width: "100%" }}
              placeholder={t("common:PLACEHOLDER.TAGS")}
            />
          </Form.Item>
          <Form.Item label={t("common:COLUMNS.DESCRIPTION")} name="description">
            <Input.TextArea />
          </Form.Item>

          <Form.Item label={t("common:COLUMNS.IMAGE")} name="image">
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
              ) : editingData && editingData.image ? (
                <img
                  src={`${API_BASE_URL}/images/${editingData.image}`}
                  alt="Yüklü Görsel"
                  style={{ marginTop: 16, width: "100%", height: "auto" }}
                />
              ) : null}
              <Button icon={<UploadOutlined />}>
                {t("common:BUTTONS.UPLOAD_EDIT_IMAGE")}
              </Button>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t("admin:MODAL.PDF_MODAL_TITLE")}
        open={printVisible}
        onOk={handlePrintModalOk}
        onCancel={handlePrintModalCancel}
        okText={t("common:BUTTONS.CREATE_PDF")}
        cancelText={t("common:BUTTONS.CANCEL")}
      >
        <Form layout="vertical">
          <Form.Item label={t("admin:MODAL.PDF_MODAL_PAPERSIZE")}>
            <Select value={paperSize} onChange={setPaperSize}>
              <Option value="a4">A4</Option>
              <Option value="a5">A5</Option>
              <Option value="letter">Letter</Option>
            </Select>
          </Form.Item>
          <Form.Item label={t("admin:MODAL.PDF_MODAL_ORIENTATION")}>
            <Select value={orientation} onChange={setOrientation}>
              <Option value="portrait">
                {t("admin:MODAL.PDF_MODAL_PORTRAIT")}
              </Option>
              <Option value="landscape">
                {t("admin:MODAL.PDF_MODAL_LANDSCAPE")}
              </Option>
            </Select>
          </Form.Item>
          <Form.Item label={t("admin:MODAL.PDF_MODAL_COLUMNSTOPRINT")}>
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
        title={t("admin:MODAL.IMAGEPREVIEW_MODAL_TITLE")}
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

export default LanguagePage;
