import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Avatar,
  Divider,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  TextField,
  Alert,
  useTheme,
} from '@mui/material';
import { profileAPI } from '../services/api';

function ProfilePage({ onBack }) {
  const theme = useTheme();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    avatar_url: '',
    description: '',
    skills: '',
    about: '',
    password: '',
    passwordConfirm: '',
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await profileAPI.getProfile();
        setProfile(res.data);
        setForm({
          name: res.data.name || '',
          email: res.data.email || '',
          avatar_url: res.data.avatar_url || '',
          description: res.data.description || '',
          skills: (res.data.skills || []).join(', '),
          about: (res.data.about || []).join(' | '),
          password: '',
          passwordConfirm: '',
        });
      } catch {
        setProfile(null);
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (form.password !== form.passwordConfirm) {
      setError('Пароли не совпадают!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        avatar_url: form.avatar_url,
        description: form.description,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        about: form.about.split('|').map((s) => s.trim()).filter(Boolean),
      };

      if (form.password) {
        payload.password = form.password;
      }

      await profileAPI.updateProfile(payload);

      setSuccess('Профиль успешно обновлен');
      setEditMode(false);

      setProfile((prev) => ({
        ...prev,
        name: form.name,
        email: form.email,
        avatar_url: form.avatar_url,
        description: form.description,
        skills: payload.skills,
        about: payload.about,
      }));
    } catch {
      setError('Ошибка при обновлении профиля');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <Typography>Загрузка профиля...</Typography>;

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        minHeight: '100vh',
      }}
    >
      <Button variant="contained" onClick={onBack} sx={{ mb: 2 }}>
        Назад
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box display="flex" alignItems="center" mb={2}>
        <Avatar
          src={form.avatar_url || profile.avatar_url}
          alt={form.name || profile.name}
          sx={{ width: 80, height: 80, mr: 3 }}
        />
        <Box sx={{ flexGrow: 1 }}>
          {editMode ? (
            <TextField
              label="Имя"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          ) : (
            <>
              <Typography variant="h4">{profile.name}</Typography>
              <Typography color="text.secondary">{profile.email}</Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Ссылка на аватар
      </Typography>
      {editMode && (
        <TextField
          name="avatar_url"
          value={form.avatar_url}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          placeholder="https://example.com/avatar.jpg"
          margin="normal"
        />
      )}

      <Typography variant="subtitle1" gutterBottom>
        О себе:
      </Typography>
      {editMode ? (
        <TextField
          name="description"
          value={form.description}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          multiline
          rows={3}
          margin="normal"
        />
      ) : (
        <Typography paragraph>{profile.description}</Typography>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Ключевые навыки:
      </Typography>
      {editMode ? (
        <TextField
          name="skills"
          value={form.skills}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          margin="normal"
          helperText="Введите через запятую"
        />
      ) : (
        <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
          {profile.skills.map((skill) => (
            <Chip key={skill} label={skill} />
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Проекты и опыт:
      </Typography>
      {editMode ? (
        <TextField
          name="about"
          value={form.about}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          multiline
          rows={3}
          margin="normal"
          helperText="Введите через |"
        />
      ) : (
        <List dense>
          {profile.about.map((item, idx) => (
            <ListItem key={idx} disablePadding>
              <ListItemText primary={item} />
            </ListItem>
          ))}
        </List>
      )}

      {editMode && (
        <Box display="flex" gap={2} mt={3}>
          <TextField
            name="password"
            type="password"
            label="Новый пароль"
            value={form.password}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            name="passwordConfirm"
            type="password"
            label="Подтвердите пароль"
            value={form.passwordConfirm}
            onChange={handleChange}
            fullWidth
          />
        </Box>
      )}

      <Box mt={3}>
        {editMode ? (
          <>
            <Button variant="contained" onClick={handleSave} disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button variant="outlined" onClick={() => setEditMode(false)} sx={{ ml: 2 }}>
              Отмена
            </Button>
          </>
        ) : (
          <Button variant="contained" onClick={() => setEditMode(true)}>
            Редактировать профиль
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default ProfilePage;
