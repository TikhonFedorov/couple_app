import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import DrawerMenu from './components/DrawerMenu';
import TodoTab from './components/TodoTab';
import WishlistTab from './components/WishlistTab';
import MenuTab from './components/MenuTab';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage'; // <-- Добавляем компонент регистрации
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import HelpPage from './components/HelpPage';
import { profileAPI } from './services/api';

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'light');
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState('main'); // теперь может принимать значения: main, profile, settings, help, login, register
  const [loading, setLoading] = useState(true);

  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode: themeMode, primary: { main: '#1976d2' }, secondary: { main: '#dc004e' } },
      }),
    [themeMode]
  );

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const themeColorMeta = document.querySelector('meta[name=theme-color]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', themeMode === 'dark' ? '#121212' : '#1976d2');
    }
  }, [themeMode]);

  const onLoginSuccess = useCallback(async (id) => {
    setUserId(id);
    try {
      const res = await profileAPI.getProfile();
      setUser(res.data);
      setPage('main');
    } catch {
      setUser(null);
    }
  }, []);

  const onRegisterSuccess = useCallback(async (id) => {
    setUserId(id);
    try {
      const res = await profileAPI.getProfile();
      setUser(res.data);
      setPage('main');
    } catch {
      setUser(null);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setUserId(null);
    setUser(null);
    setPage('login'); // При выходе показываем страницу логина
    setCurrentTab(0);
  }, []);

  const onToggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const handleMenuClick = useCallback((targetPage) => {
    setPage(targetPage);
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    profileAPI
      .getProfile()
      .then((res) => {
        setUser(res.data);
        setUserId(res.data.id);
        setPage('main');
      })
      .catch(() => {
        setUser(null);
        setUserId(null);
        setPage('login');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  // Страницы приложения — без ThemeProvider
  const pages = {
    main: (
      <>
        <Layout currentTab={currentTab} onTabChange={(e, val) => setCurrentTab(val)} onMenuClick={() => setMenuOpen(true)}>
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
          user={{
           ...user,
           avatarUrl: user?.avatar_url || user?.avatarUrl || '',
          }}
          themeMode={themeMode}
        />
      </>
    ),
    profile: <ProfilePage user={user} onBack={() => setPage('main')} />,
    settings: <SettingsPage onBack={() => setPage('main')} />,
    help: <HelpPage onBack={() => setPage('main')} />,
    login: <LoginPage onLoginSuccess={onLoginSuccess} onShowRegister={() => setPage('register')} />,
    register: <RegisterPage onRegisterSuccess={onRegisterSuccess} onShowLogin={() => setPage('login')} />,
  };

  // Если не залогинен, показываем login или register
  if (!userId && (page === 'login' || page === 'register')) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {pages[page]}
      </ThemeProvider>
    );
  }

  // Иначе показываем выбранную страницу или main (если страница неизвестна), в ThemeProvider
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {pages[page] || pages.main}
    </ThemeProvider>
  );
}

export default App;
