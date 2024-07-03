// import React, { useEffect, useState } from "react";
// import { Table, message } from "antd";
// import axios from "axios";

// const AdminUserPage = () => {
//   const [dataSource, setDataSource] = useState([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const fetchUsers = async () => {
//       setLoading(true);
//       try {
//         const token = localStorage.getItem("token");

//         if (!token) {
//           message.error("Unauthorized. Please login again.");
//           setLoading(false);
//           return;
//         }

//         const response = await axios.get("http://localhost:3000/api/users", {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         // Yanıtı detaylı şekilde loglayın
//         console.log('API response:', response.data);

//         setDataSource(response.data.data);
//         setLoading(false);
//       } catch (error) {
//         console.error('API error:', error);

//         if (error.response && error.response.status === 401) {
//           message.error("Unauthorized. Please login again.");
//         } else {
//           message.error("Failed to fetch users");
//         }
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, []);

//   const columns = [
//     {
//       title: "First Name",
//       dataIndex: "first_name",
//       key: "first_name",
//     },
//     {
//       title: "Last Name",
//       dataIndex: "last_name",
//       key: "last_name",
//     },
//     {
//       title: "Email",
//       dataIndex: "email",
//       key: "email",
//     },
//     {
//       title: "Phone Number",
//       dataIndex: "phone_number",
//       key: "phone_number",
//     },
//     {
//       title: "Roles",
//       dataIndex: "roles",
//       key: "roles",
//       render: (roles) => roles.map((role) => role.role_id.name).join(", "),
//     },
//   ];

//   return <Table dataSource={dataSource} columns={columns} loading={loading} rowKey="_id" />;
// };

// export default AdminUserPage;

import React, { useEffect, useState } from "react";
import { Table, Input, Button, Space, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import axios from "axios";
import Highlighter from "react-highlight-words";

const AdminUserPage = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          message.error("Unauthorized. Please login again.");
          setLoading(false);
          return;
        }

        const response = await axios.get("http://localhost:3000/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setDataSource(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('API error:', error);

        if (error.response && error.response.status === 401) {
          message.error("Unauthorized. Please login again.");
        } else {
          message.error("Failed to fetch users");
        }
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
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
      title: "First Name",
      dataIndex: "first_name",
      key: "first_name",
      ...getColumnSearchProps('first_name'),
    },
    {
      title: "Last Name",
      dataIndex: "last_name",
      key: "last_name",
      ...getColumnSearchProps('last_name'),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      ...getColumnSearchProps('email'),
    },
    {
      title: "Phone Number",
      dataIndex: "phone_number",
      key: "phone_number",
    },
    {
      title: "Roles",
      dataIndex: "roles",
      key: "roles",
      render: (roles) => roles.map((role) => role.role_id.name).join(", "),
    },
  ];

  return <Table dataSource={dataSource} columns={columns} loading={loading} rowKey="_id" />;
};

export default AdminUserPage;
