import React, { useState, useEffect } from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  TextField,
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import { Delete, Edit, Add } from '@mui/icons-material';
import { wishlistAPI } from '../services/api';

function WishlistTab() {
  const [wishes, setWishes] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingWish, setEditingWish] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium' 
  });

  useEffect(() => {
    loadWishes();
  }, []);

  const loadWishes = async () => {
    try {
      const response = await wishlistAPI.getAll();
      setWishes(response.data);
    } catch (error) {
      console.error('Ошибка загрузки желаний:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingWish) {
        await wishlistAPI.update(editingWish.id, formData);
      } else {
        await wishlistAPI.create(formData);
      }
      loadWishes();
      setOpen(false);
      setEditingWish(null);
      setFormData({ title: '', description: '', priority: 'medium' });
    } catch (error) {
      console.error('Ошибка сохранения желания:', error);
    }
  };

  const handleToggle = async (wish) => {
    try {
      await wishlistAPI.update(wish.id, { ...wish, completed: !wish.completed });
      loadWishes();
    } catch (error) {
      console.error('Ошибка обновления желания:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await wishlistAPI.delete(id);
      loadWishes();
    } catch (error) {
      console.error('Ошибка удаления желания:', error);
    }
  };

  const openDialog = (wish = null) => {
    setEditingWish(wish);
    setFormData(wish ? { 
      title: wish.title, 
      description: wish.description, 
      priority: wish.priority 
    } : { title: '', description: '', priority: 'medium' });
    setOpen(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Список желаний</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => openDialog()}
        >
          Добавить желание
        </Button>
      </Box>

      <Paper>
        <List>
          {wishes.map((wish) => (
            <ListItem key={wish.id} dense>
              <Checkbox
                checked={wish.completed}
                onChange={() => handleToggle(wish)}
              />
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    {wish.title}
                    <Chip 
                      label={getPriorityText(wish.priority)} 
                      color={getPriorityColor(wish.priority)}
                      size="small"
                    />
                  </Box>
                }
                secondary={
                  <>
                    {wish.description && <span>{wish.description}<br /></span>}
                    <small>Добавил: {wish.created_by_name || 'Неизвестно'}</small>
                  </>
                }
                style={{ 
                  textDecoration: wish.completed ? 'line-through' : 'none',
                  opacity: wish.completed ? 0.6 : 1
                }}
              />
              <ListItemSecondaryAction>
                <IconButton onClick={() => openDialog(wish)}>
                  <Edit />
                </IconButton>
                <IconButton onClick={() => handleDelete(wish.id)}>
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingWish ? 'Редактировать желание' : 'Новое желание'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название желания"
            fullWidth
            variant="outlined"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Описание"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Приоритет</InputLabel>
            <Select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              label="Приоритет"
            >
              <MenuItem value="low">Низкий</MenuItem>
              <MenuItem value="medium">Средний</MenuItem>
              <MenuItem value="high">Высокий</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingWish ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default WishlistTab;
