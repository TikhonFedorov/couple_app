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
  useTheme
} from '@mui/material';
import { profileAPI } from '../services/api';

function ProfilePage({ onBack }) {
  const theme = useTheme();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await profileAPI.getProfile();
        setProfile(res.data);
      } catch {
        setProfile(null);
      }
    }
    fetchProfile();
  }, []);

  if (!profile) return <Typography>Загрузка профиля...</Typography>;

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        minHeight: '100vh'
      }}
    >
      <Button variant="contained" onClick={onBack} sx={{ mb: 2 }}>
        Назад
      </Button>
      <Box display="flex" alignItems="center" mb={2}>
        <Avatar src={profile.avatar_url} alt={profile.name} sx={{ width: 80, height: 80, mr: 3 }} />
        <Box>
          <Typography variant="h4">{profile.name}</Typography>
          <Typography color="text.secondary">{profile.email}</Typography>
        </Box>
      </Box>
      <Typography variant="subtitle1" gutterBottom>
        О себе:
      </Typography>
      <Typography paragraph>{profile.description}</Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" gutterBottom>
        Ключевые навыки:
      </Typography>
      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
        {profile.skills.map((skill) => (
          <Chip key={skill} label={skill} />
        ))}
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" gutterBottom>
        Проекты и опыт:
      </Typography>
      <List dense>
        {profile.about.map((item, idx) => (
          <ListItem key={idx} disablePadding>
            <ListItemText primary={item} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default ProfilePage;
