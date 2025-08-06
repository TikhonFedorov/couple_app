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
  DialogActions
} from '@mui/material';
import { Delete, Edit, Add } from '@mui/icons-material';
import { todosAPI } from '../services/api';

function TodoTab() {
  const [todos, setTodos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '' });

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const response = await todosAPI.getAll();
      setTodos(response.data);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingTodo) {
        await todosAPI.update(editingTodo.id, formData);
      } else {
        await todosAPI.create(formData);
      }
      loadTodos();
      setOpen(false);
      setEditingTodo(null);
      setFormData({ title: '', description: '' });
    } catch (error) {
      console.error('Ошибка сохранения задачи:', error);
    }
  };

  const handleToggle = async (todo) => {
    try {
      await todosAPI.update(todo.id, { ...todo, completed: !todo.completed });
      loadTodos();
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await todosAPI.delete(id);
      loadTodos();
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
    }
  };

  const openDialog = (todo = null) => {
    setEditingTodo(todo);
    setFormData(todo ? { title: todo.title, description: todo.description } : { title: '', description: '' });
    setOpen(true);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Список дел</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => openDialog()}
        >
          Добавить задачу
        </Button>
      </Box>

      <Paper>
        <List>
          {todos.map((todo) => (
            <ListItem key={todo.id} dense>
              <Checkbox
                checked={todo.completed}
                onChange={() => handleToggle(todo)}
              />
              <ListItemText
                primary={todo.title}
                secondary={
                  <>
                    {todo.description && <span>{todo.description}<br /></span>}
                    <small>Добавил: {todo.created_by_name || 'Неизвестно'}</small>
                  </>
                }
                style={{ 
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  opacity: todo.completed ? 0.6 : 1
                }}
              />
              <ListItemSecondaryAction>
                <IconButton onClick={() => openDialog(todo)}>
                  <Edit />
                </IconButton>
                <IconButton onClick={() => handleDelete(todo.id)}>
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTodo ? 'Редактировать задачу' : 'Новая задача'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название задачи"
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTodo ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TodoTab;
