import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  message,
  Modal,
  Checkbox,
  Select,
  Input,
  Form,
  Switch
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
  EditOutlined
} from "@ant-design/icons";
import { PaperSizeOptions, OrientationOptions } from "../constants";
import Highlighter from "react-highlight-words";

const { Option } = Select;

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
  const [editModalVisible, setEditModalVisible] = useState(false); // State for edit modal
  const [editingCategory, setEditingCategory] = useState(null); // State to hold editing category
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryActive, setNewCategoryActive] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
        setLoading(false);
        return;
      }

      const response = await axios.get("http://localhost:3000/api/categories", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const formattedData = response.data.data.map(item => ({
        ...item,
        key: item._id
      }));

      setDataSource(formattedData);
      setPrintTable(formattedData);
    } catch (error) {
      console.error("API hatası:", error);

      if (error.response && error.response.status === 401) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
      } else {
        message.error("Kategoriler getirilemedi");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleActiveChange = async (id, checked) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
        return;
      }

      await axios.post(
        "http://localhost:3000/api/categories/update",
        { _id: id, is_active: checked },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      message.success("Kategori durumu başarıyla güncellendi");
      fetchCategories(); // Update the categories after successful update
    } catch (error) {
      console.error("Kategori durumu güncellenemedi:", error);
      if (error.response && error.response.status === 401) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
      } else {
        message.error("Kategori durumu güncellenemedi");
      }
    }
  };

  // const handleDeleteSelected = async () => {
  //   try {
  //     const token = localStorage.getItem("token");

  //     if (!token) {
  //       message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
  //       return;
  //     }

  //     if (selectedRowKeys.length === 0) {
  //       message.warning("Lütfen en az bir kategori seçin.");
  //       return;
  //     }

  //     Modal.confirm({
  //       title: "Kategorileri Sil",
  //       content: "Seçilen kategorileri silmek istediğinize emin misiniz?",
  //       okText: "Evet",
  //       okType: "danger",
  //       cancelText: "Hayır",
  //       onOk: async () => {
  //         await axios.post(
  //           "http://localhost:3000/api/categories/delete",
  //           { ids: selectedRowKeys },
  //           {
  //             headers: {
  //               Authorization: `Bearer ${token}`
  //             }
  //           }
  //         );

  //         message.success("Seçilen kategoriler başarıyla silindi");
  //         setDataSource(
  //           dataSource.filter(
  //             category => !selectedRowKeys.includes(category._id)
  //           )
  //         );
  //         setPrintTable(
  //           printTable.filter(
  //             category => !selectedRowKeys.includes(category._id)
  //           )
  //         );
  //         setSelectedRowKeys([]);
  //       }
  //     });
  //   } catch (error) {
  //     console.error("API hatası:", error);

  //     if (error.response && error.response.status === 401) {
  //       message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
  //     } else {
  //       message.error("Kategoriler silinemedi");
  //     }
  //   }
  // };
  const handleDeleteSelected = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
        return;
      }

      if (selectedRowKeys.length === 0) {
        message.warning("Lütfen en az bir kategori seçin.");
        return;
      }

      Modal.confirm({
        title: "Kategorileri Sil",
        content: "Seçilen kategorileri silmek istediğinize emin misiniz?",
        okText: "Evet",
        okType: "danger",
        cancelText: "Hayır",
        onOk: async () => {
          await axios.post(
            "http://localhost:3000/api/categories/delete",
            { ids: selectedRowKeys },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          message.success("Seçilen kategoriler başarıyla silindi");
          setDataSource(
            dataSource.filter(
              category => !selectedRowKeys.includes(category._id)
            )
          );
          setPrintTable(
            printTable.filter(
              category => !selectedRowKeys.includes(category._id)
            )
          );
          setSelectedRowKeys([]);
        }
      });
    } catch (error) {
      console.error("API hatası:", error);

      if (error.response && error.response.status === 401) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
      } else {
        message.error("Kategoriler silinemedi");
      }
    }
  };

  // const handleDeleteAll = async () => {
  //   try {
  //     const token = localStorage.getItem("token");

  //     if (!token) {
  //       message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
  //       return;
  //     }

  //     if (dataSource.length === 0) {
  //       message.warning("Silinecek kategori bulunamadı.");
  //       return;
  //     }

  //     Modal.confirm({
  //       title: "Tüm Kategorileri Sil",
  //       content: "Tüm kategorileri silmek istediğinize emin misiniz?",
  //       okText: "Evet",
  //       okType: "danger",
  //       cancelText: "Hayır",
  //       onOk: async () => {
  //         await axios.post(
  //           "http://localhost:3000/api/categories/delete",
  //           { ids: dataSource.map(category => category._id) },
  //           {
  //             headers: {
  //               Authorization: `Bearer ${token}`
  //             }
  //           }
  //         );

  //         message.success("Tüm kategoriler başarıyla silindi");
  //         setDataSource([]);
  //         setPrintTable([]);
  //         setSelectedRowKeys([]);
  //       }
  //     });
  //   } catch (error) {
  //     console.error("API hatası:", error);

  //     if (error.response && error.response.status === 401) {
  //       message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
  //     } else {
  //       message.error("Kategoriler silinemedi");
  //     }
  //   }
  // };
  const handleDeleteAll = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
        return;
      }

      if (dataSource.length === 0) {
        message.warning("Silinecek kategori bulunamadı.");
        return;
      }

      Modal.confirm({
        title: "Tüm Kategorileri Sil",
        content: "Tüm kategorileri silmek istediğinize emin misiniz?",
        okText: "Evet",
        okType: "danger",
        cancelText: "Hayır",
        onOk: async () => {
          await axios.post(
            "http://localhost:3000/api/categories/delete",
            { ids: dataSource.map(category => category._id) },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          message.success("Tüm kategoriler başarıyla silindi");
          setDataSource([]);
          setPrintTable([]);
          setSelectedRowKeys([]);
        }
      });
    } catch (error) {
      console.error("API hatası:", error);

      if (error.response && error.response.status === 401) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
      } else {
        message.error("Kategoriler silinemedi");
      }
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("pagination:", pagination);
    console.log("filters:", filters);
    console.log("sorter:", sorter);
  };

  const handlePrint = () => {
    setPrintVisible(true);
  };

  const handlePrintConfirm = () => {
    const unit = "pt";
    const size = paperSize;
    const marginLeft = 40;
    const doc = new jsPDF({
      orientation,
      unit,
      format: size
    });

    doc.setFontSize(15);
    doc.text("Kategori Listesi", marginLeft, 40);

    const tableColumnData = columns
      .filter(col => selectedColumns.includes(col.dataIndex))
      .map(col => col.title);

    const tableData = printTable.map(row =>
      selectedColumns.map(col =>
        col === "created_at"
          ? moment(row[col]).format("DD/MM/YYYY HH:mm")
          : row[col]
          ? row[col].toString()
          : ""
      )
    );

    doc.autoTable({
      startY: 50,
      head: [tableColumnData],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 8, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 70 },
        2: { cellWidth: 100 }
      }
    });

    doc.save("kategori_listesi.pdf");
    setPrintVisible(false);
  };

  const handlePrintCancel = () => {
    setPrintVisible(false);
  };

  const handlePaperSizeChange = value => {
    setPaperSize(value);
  };

  const handleOrientationChange = value => {
    setOrientation(value);
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
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          id={`${dataIndex}-search-input`}
          placeholder={`Ara ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: "block" }}
        />
        <Button
          type="primary"
          onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
          icon={<SearchOutlined />}
          size="small"
          style={{ width: 90 }}
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
    onFilterDropdownOpenChange: open => {
      if (open) {
        setTimeout(
          () => document.getElementById(`${dataIndex}-search-input`).select(),
          100
        );
      }
    },
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
      ...getColumnSearchProps("name")
    },
    {
      title: "Oluşturulma Tarihi",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) =>
        moment(a.created_at).unix() - moment(b.created_at).unix(),
      render: date => moment(date).format("DD/MM/YYYY HH:mm")
    },
    {
      title: "Durum",
      dataIndex: "is_active",
      key: "is_active",
      render: (text, record) => (
        <Switch
          checked={text}
          onChange={checked => handleActiveChange(record._id, checked)}
        />
      )
    },
    {
      title: "İşlemler",
      key: "actions",
      render: (text, record) => (
        <>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Düzenle
          </Button>
        </>
      )
    }
  ];

  const handleAddModalOpen = () => {
    setAddModalVisible(true);
  };

  const handleAddModalClose = () => {
    setAddModalVisible(false);
  };

  const handleAddCategory = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
        return;
      }

      if (!newCategoryName) {
        message.warning("Lütfen kategori adı girin.");
        return;
      }

      const response = await axios.post(
        "http://localhost:3000/api/categories/add",
        {
          name: newCategoryName,
          active: newCategoryActive
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const newCategory = response.data.data;

      // Veri kaynağına yeni kategoriyi hemen ekleyelim
      setDataSource([...dataSource, { ...newCategory, key: newCategory._id }]);
      setPrintTable([...printTable, { ...newCategory, key: newCategory._id }]);

      // Kategori ekledikten sonra tüm kategorileri yeniden getirerek tabloyu güncelleyelim

      await fetchCategories();
      message.success(`${newCategoryName} kategorisi başarıyla eklendi.`);

      setNewCategoryName(""); // Kategori adı alanını temizle
      setNewCategoryActive(true); // Aktif alanını varsayılan olarak ayarla
      setAddModalVisible(false); // Modalı kapat
    } catch (error) {
      console.error("API hatası:", error);

      if (error.response && error.response.status === 401) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
      } else {
        message.error("Kategori eklenemedi");
      }
    }
  };

  const handleEdit = record => {
    setEditingCategory(record);
    setEditModalVisible(true);
  };

  const handleEditModalClose = () => {
    setEditingCategory(null);
    setEditModalVisible(false);
  };

  const handleEditCategory = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
        return;
      }

      if (!editingCategory.name) {
        message.warning("Lütfen kategori adı girin.");
        return;
      }

      const response = await axios.post(
        "http://localhost:3000/api/categories/update",
        {
          _id: editingCategory._id,
          name: editingCategory.name,
          is_active: editingCategory.is_active
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      message.success("Kategori başarıyla güncellendi");
      fetchCategories(); // güncelleme tamamlandığında tabloyu yenile
      setEditingCategory(null);
      setEditModalVisible(false);
    } catch (error) {
      console.error("Kategori güncellenemedi:", error);
      if (error.response && error.response.status === 401) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
      } else {
        message.error("Kategori güncellenemedi");
      }
    }
  };
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddModalOpen}
        >
          Yeni Kategori
        </Button>{" "}
        {selectedRowKeys.length > 0 && (
          <>
            <Button
              type="danger"
              icon={<DeleteOutlined />}
              onClick={handleDeleteSelected}
            >
              Seçilenleri Sil
            </Button>{" "}
          </>
        )}
        {selectedRowKeys.length > 0 && (
          <Button
            type="danger"
            icon={<DeleteOutlined />}
            onClick={handleDeleteAll}
          >
            Tümünü Sil
          </Button>
        )}{" "}
        <Button type="default" icon={<PrinterOutlined />} onClick={handlePrint}>
          Yazdır
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource.map(item => ({
          ...item,
          key: item._id // veya benzersiz bir alan
        }))}
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys
        }}
        onChange={handleTableChange}
        pagination={{
          pageSize,
          total: dataSource.length,
          showTotal: total => `${total} kategori`,
          showSizeChanger: true,
          onShowSizeChange: (current, size) => setPageSize(size),
          pageSizeOptions: ["10", "20", "50", "100"] //TODO:env, constants ya da config dosyasından alınacak
        }}
      />
      {/* <Modal
        title="Kategorileri Yazdır"
        open={printVisible}
        onOk={handlePrintConfirm}
        onCancel={handlePrintCancel}
        okText="Pdf Oluştur"
        cancelText="Vazgeç"
      >
        <Select
          defaultValue="a4"
          style={{ width: 120, marginBottom: 16 }}
          onChange={handlePaperSizeChange}
        >
          {PaperSizeOptions.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>{" "}
        <Select
          defaultValue="landscape"
          style={{ width: 120, marginBottom: 16 }}
          onChange={handleOrientationChange}
        >
          {OrientationOptions.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>{" "}
        <Checkbox.Group
          style={{ width: "100%" }}
          onChange={setSelectedColumns}
          value={selectedColumns}
        >
          {columns.map(column => (
            <Checkbox key={column.dataIndex} value={column.dataIndex}>
              {column.title}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Modal> */}
<Modal
  title="Kategorileri Yazdır"
  visible={printVisible}
  onOk={handlePrintConfirm}
  onCancel={handlePrintCancel}
  okText="Pdf Oluştur"
  cancelText="Vazgeç"
>
  <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
    <Form.Item label="Kağıt Boyutu" style={{ marginRight: 16 }}>
      <Select
        defaultValue="a4"
        style={{ width: 120 }}
        onChange={handlePaperSizeChange}
      >
        {PaperSizeOptions.map(option => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
    </Form.Item>

    <Form.Item label="Yön">
      <Select
        defaultValue="landscape"
        style={{ width: 120 }}
        onChange={handleOrientationChange}
      >
        {OrientationOptions.map(option => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
    </Form.Item>
  </div>

  <Form.Item label="Yazdırılacak Sütunları Seç">
    <Checkbox.Group
      style={{ width: "100%" }}
      onChange={setSelectedColumns}
      value={selectedColumns}
    >
      {columns.map(column => (
        <Checkbox key={column.dataIndex} value={column.dataIndex}>
          {column.title}
        </Checkbox>
      ))}
    </Checkbox.Group>
  </Form.Item>
</Modal>


      <Modal
        title="Yeni Kategori Ekle"
        open={addModalVisible}
        onOk={handleAddCategory}
        onCancel={() => {
          setAddModalVisible(false);
          setNewCategoryName("");
          setNewCategoryActive(true);
        }}
        okText="Ekle"
        cancelText="İptal"
      >
        <Form layout="vertical">
          <Form.Item
            label="Kategori Adı"
            required
            tooltip="Yeni kategori için bir ad girin"
          >
            <Input
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Aktif">
            <Switch
              checked={newCategoryActive}
              onChange={checked => setNewCategoryActive(checked)}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Kategori Düzenle"
        open={editModalVisible}
        onOk={handleEditCategory}
        onCancel={handleEditModalClose}
        okText="Kaydet"
        cancelText="Vazgeç"
      >
        <Form.Item label="Kategori Adı" required>
          <Input
            value={editingCategory && editingCategory.name}
            onChange={e =>
              setEditingCategory({ ...editingCategory, name: e.target.value })
            }
          />
        </Form.Item>
        <Form.Item label="Aktif mi?">
          <Switch
            checked={editingCategory && editingCategory.is_active}
            onChange={checked =>
              setEditingCategory({
                ...editingCategory,
                is_active: checked
              })
            }
          />
        </Form.Item>
      </Modal>
    </div>
  );
};

export default CategoryPage;
