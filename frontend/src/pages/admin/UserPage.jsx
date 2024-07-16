import React, { useEffect, useState, useRef } from "react";
import { Table, Button, message, Modal, Input } from "antd";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable"; // jspdf-autotable'ı burada içe aktarın
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";

const { confirm } = Modal;

const AdminUserPage = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [pageSize, setPageSize] = useState(10); // default page size

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
        setLoading(false);
        return;
      }

      const response = await axios.get("http://localhost:3000/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDataSource(response.data.data.users);
      setCurrentUser(response.data.data.currentUser);
    } catch (error) {
      console.error('API hatası:', error);

      if (error.response && error.response.status === 401) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
      } else {
        message.error("Kullanıcılar getirilemedi");
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const unit = "pt";
    const size = "A4";
    const orientation = "landscape";
    const marginLeft = 40;
    const doc = new jsPDF(orientation, unit, size);

    doc.setFontSize(15);
    doc.text("Kullanıcı Listesi", marginLeft, 40);

    const tableData = dataSource.map((row) => {
      return [
        row.first_name,
        row.last_name,
        row.email,
        row.phone_number,
        row.roles.map((role) => role.role_id.role_name).join(", "),
      ];
    });

    doc.autoTable({
      startY: 50,
      head: [["Adı", "Soyadı", "E-posta", "Telefon Numarası", "Roller"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 8, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 70 },
        2: { cellWidth: 100 },
        3: { cellWidth: 90 },
        4: { cellWidth: 120 },
      },
    });

    doc.save("kullanici_listesi.pdf");
  };

  const showDeleteConfirm = (userId) => {
    if (currentUser && currentUser === userId) {
      message.warning("Kendi kullanıcı kaydınızı silemezsiniz.");
      return;
    }

    confirm({
      title: 'Bu kullanıcıyı silmek istediğinizden emin misiniz?',
      okText: 'Evet',
      okType: 'danger',
      cancelText: 'Hayır',
      onOk() {
        handleDelete(userId);
      },
      onCancel() {
        console.log('Silme işlemi iptal edildi');
      },
    });
  };

  const handleDelete = async (userId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
        return;
      }

      await axios.post(`http://localhost:3000/api/users/delete`, { _id: userId }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      message.success("Kullanıcı başarıyla silindi");
      setDataSource(dataSource.filter(user => user._id !== userId));
    } catch (error) {
      console.error('API hatası:', error);

      if (error.response && error.response.status === 401) {
        message.error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
      } else {
        message.error("Kullanıcı silinemedi");
      }
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("pagination:", pagination);
    console.log("filters:", filters);
    console.log("sorter:", sorter);
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`${dataIndex} alanında ara`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
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
          Sıfırla
        </Button>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilterDropdownOpenChange: (open) => {
      if (open) {
        setTimeout(() => document.querySelector('input.ant-input').select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };

  const columns = [
    {
      title: "Adı",
      dataIndex: "first_name",
      key: "first_name",
      ...getColumnSearchProps('first_name'),
      sorter: (a, b) => a.first_name.localeCompare(b.first_name),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: "Soyadı",
      dataIndex: "last_name",
      key: "last_name",
      ...getColumnSearchProps('last_name'),
      sorter: (a, b) => a.last_name.localeCompare(b.last_name),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: "E-posta",
      dataIndex: "email",
      key: "email",
      ...getColumnSearchProps('email'),
      sorter: (a, b) => a.email.localeCompare(b.email),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: "Telefon Numarası",
      dataIndex: "phone_number",
      key: "phone_number",
    },
    {
      title: "Roller",
      dataIndex: "roles",
      key: "roles",
      render: (roles) => roles.map((role) => role.role_id.role_name).join(", "),
      sorter: (a, b) => (a.roles.map(role => role.role_id.role_name).join(", ") || "").localeCompare(b.roles.map(role => role.role_id.role_name).join(", ") || ""),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'İşlemler',
      key: 'action',
      render: (text, record) => (
        <Button type="link" danger onClick={() => showDeleteConfirm(record._id)}>Sil</Button>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button onClick={exportToPDF}>PDF'e Aktar</Button>
      </div>
      <Table
        dataSource={dataSource}
        columns={columns}
        loading={loading}
        rowKey="_id"
        onChange={handleTableChange}
        pagination={{
          pageSize: pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          onShowSizeChange: (current, size) => setPageSize(size),
          total: dataSource.length,
        }}
      />
    </>
  );
};

export default AdminUserPage;
