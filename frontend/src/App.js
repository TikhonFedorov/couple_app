import React, { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import DrawerMenu from './components/DrawerMenu';
import TodoTab from './components/TodoTab';
import WishlistTab from './components/WishlistTab';
import MenuTab from './components/MenuTab';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import HelpPage from './components/HelpPage';
import { profileAPI } from './services/api';

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null); // Храним профиль
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'light';
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState('main');

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode: themeMode,
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
      },
    }),
    [themeMode]
  );

  useEffect(() => {
    // Сохраняем тему при изменении
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  const onLoginSuccess = async (id) => {
    setUserId(id);
    try {
      const res = await profileAPI.getProfile();
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  // Также загружаем профиль при инициализации, если уже залогинены
  useEffect(() => {
  profileAPI.getProfile()
    .then(res => {
      setUser(res.data);
      setUserId(res.data.id); // если id в профиле отсутствует, добавьте его в ответе сервера
    })
    .catch(() => {
      setUser(null);
      setUserId(null);
    });
  }, []);

  const handleLogout = () => {
    setUserId(null);
    setUser(null);
    setPage('main');
    setCurrentTab(0);
  };

  const onToggleTheme = () => setThemeMode(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleMenuClick = (targetPage) => {
    setPage(targetPage);
    setMenuOpen(false);
  };

  if (!userId) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginPage onLoginSuccess={onLoginSuccess} />
      </ThemeProvider>
    );
  }

  if (page === 'profile') return <ProfilePage user={user} onBack={() => setPage('main')} />;
  if (page === 'settings') return <SettingsPage onBack={() => setPage('main')} />;
  if (page === 'help') return <HelpPage onBack={() => setPage('main')} />;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!userId ? (
        <LoginPage onLoginSuccess={onLoginSuccess} />
      ) : page === 'profile' ? (
        <ProfilePage user={user} onBack={() => setPage('main')} />
      ) : page === 'settings' ? (
        <SettingsPage onBack={() => setPage('main')} />
      ) : page === 'help' ? (
        <HelpPage onBack={() => setPage('main')} />
      ) : (
        <>
          <Layout
            currentTab={currentTab}
            onTabChange={(e, val) => setCurrentTab(val)}
            onMenuClick={() => setMenuOpen(true)}
          >
            {{
              0: <TodoTab />,
              1: <WishlistTab />,
              2: <MenuTab />,
            }[currentTab]}
          </Layout>
          <DrawerMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onNavigate={handleMenuClick}
            onLogout={handleLogout}
            onToggleTheme={onToggleTheme}
            user={user || { name: 'User Name', avatarUrl: '' }}
            themeMode={themeMode}
          />
        </>
      )}
    </ThemeProvider>
  );
}

export default App;