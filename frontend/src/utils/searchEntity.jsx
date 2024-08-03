import { SearchOutlined } from "@ant-design/icons";
import { Input, Button } from "antd";
import Highlighter from "react-highlight-words";
import i18n from "../i18n";

export const getColumnSearchProps = (
  dataIndex,
  searchedColumn,
  setSearchedColumn,
  searchText,
  setSearchText,
  handleSearch,
  handleReset,
  t
) => ({
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
        onChange={e => {
          setSelectedKeys(e.target.value ? [e.target.value] : []);
          setSearchText(e.target.value); // Arama metnini ayarla
        }}
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
        {t("common:SEARCH.SEARCH")}
      </Button>
      <Button
        onClick={() => handleReset(clearFilters)}
        size="small"
        style={{ width: 90 }}
      >
        {t("common:SEARCH.RESET")}
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
