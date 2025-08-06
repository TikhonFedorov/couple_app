import React, { useEffect, useState } from 'react';
import {
  Paper,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
} from '@mui/material';
import { Delete, Edit, Add } from '@mui/icons-material';
import { menuAPI, dishesAPI } from '../services/api'; // Убедитесь, что API для блюд тоже есть

function MenuTab() {
  const [menuItems, setMenuItems] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [openMenu, setOpenMenu] = useState(false);
  const [openDish, setOpenDish] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    dish_id: null,
    day_of_week: '',
    meal_type: '',
  });
  const [newDishData, setNewDishData] = useState({
    name: '',
    category: '',
    image_url: '',
    recipe_url: '',
  });

  const daysOfWeek = [
    { value: 'monday', label: 'Понедельник' },
    { value: 'tuesday', label: 'Вторник' },
    { value: 'wednesday', label: 'Среда' },
    { value: 'thursday', label: 'Четверг' },
    { value: 'friday', label: 'Пятница' },
    { value: 'saturday', label: 'Суббота' },
    { value: 'sunday', label: 'Воскресенье' },
  ];

  const mealTypes = [
    { value: 'breakfast', label: 'Завтрак' },
    { value: 'lunch', label: 'Обед' },
    { value: 'dinner', label: 'Ужин' },
  ];

  useEffect(() => {
    loadMenuItems();
    loadDishes();
  }, []);

  const loadMenuItems = async () => {
    try {
      const res = await menuAPI.getAll();
      setMenuItems(res.data);
    } catch (error) {
      console.error('Ошибка загрузки меню:', error);
    }
  };

  const loadDishes = async () => {
    try {
      const res = await dishesAPI.getAll();
      setDishes(res.data);
    } catch (error) {
      console.error('Ошибка загрузки базы блюд:', error);
    }
  };

  const openMenuDialog = (item = null) => {
    setEditingItem(item);
    setFormData({
      dish_id: item ? item.dish_id : null,
      day_of_week: item ? item.day_of_week : '',
      meal_type: item ? item.meal_type : '',
    });
    setOpenMenu(true);
  };

  const openDishDialog = () => {
    setNewDishData({
      name: '',
      category: '',
      image_url: '',
      recipe_url: '',
    });
    setOpenDish(true);
  };

  const handleMenuSubmit = async () => {
    if (!formData.dish_id || !formData.day_of_week || !formData.meal_type) return;
    try {
      if (editingItem) {
        await menuAPI.update(editingItem.id, formData);
      } else {
        await menuAPI.create(formData);
      }
      loadMenuItems();
      setOpenMenu(false);
      setEditingItem(null);
      setFormData({ dish_id: null, day_of_week: '', meal_type: '' });
    } catch (error) {
      console.error('Ошибка сохранения меню:', error);
    }
  };

  const handleDishSubmit = async () => {
    if (!newDishData.name || !newDishData.category) return;
    try {
      await dishesAPI.create(newDishData);
      loadDishes();
      setOpenDish(false);
      setNewDishData({ name: '', category: '', image_url: '', recipe_url: '' });
    } catch (error) {
      console.error('Ошибка добавления блюда в базу:', error);
    }
  };

  const handleDeleteMenuItem = async (id) => {
    try {
      await menuAPI.delete(id);
      loadMenuItems();
    } catch (error) {
      console.error('Ошибка удаления блюда из меню:', error);
    }
  };

  // Группировка меню по дню недели
  const groupedMenu = daysOfWeek.reduce((acc, day) => {
    acc[day.value] = menuItems.filter(item => item.day_of_week === day.value);
    return acc;
  }, {});

  // Получить название блюда по его id
  const getDishById = (id) => dishes.find(d => d.id === id) || {};

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Меню на неделю</Typography>
        <Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenMenu(true)} sx={{ mr: 1 }}>
            Выбрать блюдо
          </Button>
          <Button variant="outlined" onClick={openDishDialog}>
            Добавить новое блюдо
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {daysOfWeek.map(day => (
          <Grid item xs={12} md={6} lg={4} key={day.value}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>{day.label}</Typography>
              {groupedMenu[day.value]?.length === 0 ? (
                <Typography color="textSecondary">Нет блюд</Typography>
              ) : (
                groupedMenu[day.value].map(item => {
                  const dish = getDishById(item.dish_id);
                  return (
                    <Card key={item.id} sx={{ mb: 1 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="subtitle1">{dish.name || 'Без названия'}</Typography>
                            <Typography variant="caption" color="textSecondary">{dish.category || ''}</Typography>
                            {dish.image_url && (
                              <Box component="img"
                                src={dish.image_url}
                                alt={dish.name}
                                sx={{ width: '100%', maxHeight: 150, objectFit: 'cover', mt: 1, mb: 1 }}
                              />
                            )}
                            {dish.recipe_url && (
                              <Typography
                                variant="body2"
                                component="a"
                                href={dish.recipe_url}
                                target="_blank"
                                rel="noreferrer"
                                sx={{ color: 'primary.main', textDecoration: 'none' }}
                              >
                                Рецепт
                              </Typography>
                            )}
                          </Box>
                          <Box>
                            <IconButton size="small" onClick={() => openMenuDialog(item)}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteMenuItem(item.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Диалог выбора блюда в меню */}
      <Dialog open={openMenu} onClose={() => setOpenMenu(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Редактировать блюдо в меню' : 'Выбрать блюдо для меню'}</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={dishes}
            getOptionLabel={(option) => option.name}
            value={dishes.find(d => d.id === formData.dish_id) || null}
            onChange={(e, value) => setFormData({ ...formData, dish_id: value ? value.id : null })}
            renderInput={(params) => <TextField {...params} label="Блюдо" margin="normal" fullWidth />}
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>День недели</InputLabel>
            <Select
              value={formData.day_of_week}
              label="День недели"
              onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
            >
              {daysOfWeek.map(day => (
                <MenuItem key={day.value} value={day.value}>{day.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Тип приема пищи</InputLabel>
            <Select
              value={formData.meal_type}
              label="Тип приема пищи"
              onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
            >
              {mealTypes.map(meal => (
                <MenuItem key={meal.value} value={meal.value}>{meal.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMenu(false)}>Отмена</Button>
          <Button onClick={handleMenuSubmit} variant="contained">
            {editingItem ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог добавления нового блюда в базу */}
      <Dialog open={openDish} onClose={() => setOpenDish(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить новое блюдо в базу</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Название"
            fullWidth
            value={newDishData.name}
            onChange={(e) => setNewDishData({ ...newDishData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Категория"
            fullWidth
            value={newDishData.category}
            onChange={(e) => setNewDishData({ ...newDishData, category: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Ссылка на картинку"
            fullWidth
            value={newDishData.image_url}
            onChange={(e) => setNewDishData({ ...newDishData, image_url: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Ссылка на рецепт"
            fullWidth
            value={newDishData.recipe_url}
            onChange={(e) => setNewDishData({ ...newDishData, recipe_url: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDish(false)}>Отмена</Button>
          <Button onClick={handleDishSubmit} variant="contained">
            Добавить блюдо
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MenuTab;