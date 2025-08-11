import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, Link } from '@mui/material';
import { authAPI } from '../services/api';

function LoginPage({ onLoginSuccess, onShowRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await authAPI.login({ username, password });
      if (response.data.error) {
        setError(response.data.error);
      } else {
        onLoginSuccess(response.data.user_id); // передать родителю статус
      }
    } catch (err) {
      setError('Ошибка входа. Проверьте логин и пароль.');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
      <Paper sx={{ p: 4, width: 320 }}>
        <Typography variant="h5" component="h1" gutterBottom textAlign="center">
          Вход в приложение
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Логин"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Пароль"
            type="password"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Войти
          </Button>
        </form>
        <Box mt={2} textAlign="center">
          <Typography variant="body2">
            Нет аккаунта?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={onShowRegister}
              sx={{ cursor: 'pointer' }}
            >
              Зарегистрируйтесь
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default LoginPage;
