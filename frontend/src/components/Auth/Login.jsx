import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';

const Login = () => {
  const onFinish = async (values) => {
    try {
      const response = await axios.post('http://localhost:3000/api/users/auth', values);

      // Yanıtı detaylı şekilde loglayın
      console.log('API response:', response.data);

      // Yanıttan token'ı alın
      const { token, user } = response.data;

      // Token'ı kontrol edin ve kaydedin
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        message.success('Login successful');
        window.location.href="/admin"
      } else {
        message.error('Login failed. No token received.');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        message.error('Login failed. Please check your credentials and try again.');
      } else {
        message.error('An error occurred. Please try again later.');
      }
    }
  };

  return (
    <div className="account-column">
      <h2>Login</h2>
      <Form
        name="normal_login"
        className="login-form"
        initialValues={{ remember: true }}
        onFinish={onFinish}
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Please input your Email!' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Email" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your Password!' }]}
        >
          <Input
            prefix={<LockOutlined />}
            type="password"
            placeholder="Password"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" className="login-form-button">
            Log in
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
