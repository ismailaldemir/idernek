import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";
import AuthPage from "./pages/AuthPage";
import UserPage from "./pages/admin/UserPage";
import CategoryPage from "./pages/admin/Categories/CategoryPage";
import ContactsPage from "./pages/admin/Contacts/ContactsPage";
import LanguagePage from "./pages/admin/Languages/LanguagePage";
import AdminLayout from './layouts/AdminLayout';

import "./App.css";

import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';



function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin/*">
          <Route path="users" element={<UserPage />} />
          <Route path="categories" element={<CategoryPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="languages" element={<LanguagePage />} />
        </Route>
      </Routes>
    </I18nextProvider>
  );
}

export default App;
