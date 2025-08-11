import React, { useState, useEffect } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, RadioGroup, FormControlLabel, Radio, Select, MenuItem } from '@mui/material';
import { authAPI } from '../services/api';

function RegisterPage({ onRegisterSuccess, onShowLogin }) {
  const [form, setForm] = useState({
    username: '',
    password: '',
    couple_name: '',
    couple_id: '',
    name: '',
    email: '',
    avatar_url: '',
    description: '',
    skills: '',
    about: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coupleOption, setCoupleOption] = useState('new');
  const [existingCouples, setExistingCouples] = useState([]);

  useEffect(() => {
    authAPI.getCouples()
      .then(res => setExistingCouples(res.data))
      .catch(() => setExistingCouples([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (e) => {
    setCoupleOption(e.target.value);
    setForm(prev => ({ ...prev, couple_name: '', couple_id: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const dataToSend = {
      username: form.username,
      password: form.password,
      name: form.name,
      email: form.email,
      avatar_url: form.avatar_url,
      description: form.description,
      skills: form.skills.split(',').map(s => s.trim()),
      about: form.about.split('|').map(s => s.trim()),
    };
    if (coupleOption === 'new') {
      dataToSend.couple_name = form.couple_name;
    } else {
      dataToSend.couple_id = form.couple_id;
    }

    try {
      const res = await authAPI.register(dataToSend);
      if (res.data.user_id) {
        onRegisterSuccess(res.data.user_id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh" sx={{ backgroundColor: 'var(--background-color)' }}>
      <Paper sx={{ p: 4, width: 360 }}>
        <Typography variant="h5" component="h1" gutterBottom textAlign="center">Регистрация</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField label="Логин" name="username" value={form.username} onChange={handleChange} variant="outlined" fullWidth required margin="normal" />
          <TextField label="Пароль" name="password" type="password" value={form.password} onChange={handleChange} variant="outlined" fullWidth required margin="normal" />

          <RadioGroup row value={coupleOption} onChange={handleOptionChange} sx={{ mb: 2 }}>
            <FormControlLabel value="new" control={<Radio />} label="Создать новую пару" />
            <FormControlLabel value="existing" control={<Radio />} label="Выбрать существующую пару" />
          </RadioGroup>

          {coupleOption === 'new' ? (
            <TextField label="Название пары" name="couple_name" value={form.couple_name} onChange={handleChange} variant="outlined" fullWidth margin="normal" required />
          ) : (
            <Select name="couple_id" value={form.couple_id} onChange={handleChange} fullWidth displayEmpty required margin="normal">
              <MenuItem value="" disabled>Выберите пару</MenuItem>
              {existingCouples.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          )}

          <TextField label="Имя" name="name" value={form.name} onChange={handleChange} variant="outlined" fullWidth margin="normal" />
          <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} variant="outlined" fullWidth margin="normal" />
          <TextField label="Ссылка на аватар" name="avatar_url" value={form.avatar_url} onChange={handleChange} variant="outlined" fullWidth margin="normal" />
          <TextField label="Описание" name="description" value={form.description} onChange={handleChange} variant="outlined" fullWidth multiline rows={2} margin="normal" />
          <TextField label="Навыки (через запятую)" name="skills" value={form.skills} onChange={handleChange} variant="outlined" fullWidth margin="normal" />
          <TextField label="О себе (через |)" name="about" value={form.about} onChange={handleChange} variant="outlined" fullWidth margin="normal" />

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </form>

        <Box mt={2} textAlign="center">
          <Typography variant="body2">
            Уже есть аккаунт?{' '}
            <Button variant="text" size="small" onClick={onShowLogin}>Войти</Button>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default RegisterPage;