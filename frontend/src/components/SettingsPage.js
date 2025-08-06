import React from 'react';
import { Box, Button, Typography } from '@mui/material';

function SettingsPage({ onBack }) {
  return (
    <Box sx={{ p: 3 }}>
      <Button variant="contained" onClick={onBack} sx={{ mb: 2 }}>
        Назад
      </Button>
      <Typography variant="h4" gutterBottom>
        Настройки
      </Typography>
      {/* Здесь можно добавить настройки */}
      <Typography>Здесь будут настройки приложения</Typography>
    </Box>
  );
}

export default SettingsPage;
