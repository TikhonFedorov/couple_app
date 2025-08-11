import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  Avatar,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  Button,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';

function DrawerMenu({ open, onClose, onNavigate, onLogout, onToggleTheme, user, themeMode }) {
  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 250 }} role="presentation" onClick={onClose} onKeyDown={onClose}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={user.avatar_url || user.avatarUrl} alt={user.name} />
          <Box>
            <Typography variant="subtitle1">{user.name || 'User Name'}</Typography>
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('profile');
              }}
            >
              Профиль
            </Typography>
          </Box>
        </Box>
        <Divider />
        <List>
          <ListItemButton onClick={() => onNavigate('settings')}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Настройки" />
          </ListItemButton>
          <ListItemButton onClick={() => onNavigate('help')}>
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText primary="Справка" />
          </ListItemButton>
          <ListItemButton onClick={(e) => e.stopPropagation()}>
            <ListItemIcon>
              <Brightness4Icon />
            </ListItemIcon>
            <ListItemText primary="Тёмная тема" />
            <Switch checked={themeMode === 'dark'} onChange={onToggleTheme} />
          </ListItemButton>
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              onLogout();
            }}
          >
            Выйти
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

export default DrawerMenu;
