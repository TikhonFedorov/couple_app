import React from 'react';
import { Box, Button, Typography } from '@mui/material';

function HelpPage({ onBack }) {
  return (
    <Box sx={{ p: 3 }}>
      <Button variant="contained" onClick={onBack} sx={{ mb: 2 }}>
        Назад
      </Button>
      <Typography variant="h4" gutterBottom>
        Справка
      </Typography>
      {/* Добавьте сюда часто задаваемые вопросы или инструкции */}
      <Typography>Здесь вы можете найти помощь по приложению.</Typography>
    </Box>
  );
}

export default HelpPage;
