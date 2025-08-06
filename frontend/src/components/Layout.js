import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Container,
  IconButton,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

function Layout({ children, currentTab, onTabChange, onMenuClick }) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Приложение для пары
          </Typography>
        </Toolbar>
        <Tabs
          value={currentTab}
          onChange={onTabChange}
          textColor="inherit"
          indicatorColor="secondary"
          variant="fullWidth"
        >
          <Tab label="To Do" />
          <Tab label="Wishlist" />
          <Tab label="Меню" />
        </Tabs>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 3 }}>
        {children}
      </Container>
    </Box>
  );
}

export default Layout;
