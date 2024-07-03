import React from 'react';
import { Container, Box, Typography, TextField, Button, Grid, Paper } from '@mui/material';
import { styled } from '@mui/system';

const Root = styled(Container)({
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f5f5f5',
});

const CustomPaper = styled(Paper)({
  padding: '32px',
  maxWidth: 400,
  width: '100%',
});

const CustomForm = styled('form')({
  marginTop: '16px',
});

const CustomButton = styled(Button)({
  marginTop: '16px',
});

const Register = () => {
  const onFinish = async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const values = Object.fromEntries(form.entries());

    try {
      const response = await fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Registration successful');
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  return (
    <Root component="main">
      <CustomPaper elevation={3}>
        <Typography component="h1" variant="h5">
          Register
        </Typography>
        <CustomForm onSubmit={onFinish} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                autoComplete="fname"
                name="first_name"
                variant="outlined"
                required
                fullWidth
                id="first_name"
                label="First Name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                autoComplete="lname"
                name="last_name"
                variant="outlined"
                required
                fullWidth
                id="last_name"
                label="Last Name"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="phone_number"
                label="Phone Number"
                name="phone_number"
              />
            </Grid>
          </Grid>
          <CustomButton
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
          >
            Register
          </CustomButton>
        </CustomForm>
      </CustomPaper>
    </Root>
  );
};

export default Register;
