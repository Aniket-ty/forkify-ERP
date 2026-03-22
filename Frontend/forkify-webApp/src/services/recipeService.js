import api from './api';

const recipeService = {
  // Recipes
  getAll:        (params = {}) => api.get('/recipes', { params }),
  getById:       (id)          => api.get(`/recipes/${id}`),
  getCost:       (id, servings) => api.get(`/recipes/${id}/cost`, { params: { servings } }),
  create:        (data)         => api.post('/recipes', data),
  update:        (id, data)     => api.put(`/recipes/${id}`, data),
  delete:        (id)           => api.delete(`/recipes/${id}`),
  getCategories: ()             => api.get('/recipes/categories'),

  // Ingredients
  getAllIngredients:        (params = {}) => api.get('/ingredients', { params }),
  getIngredientById:       (id)           => api.get(`/ingredients/${id}`),
  createIngredient:        (data)         => api.post('/ingredients', data),
  updateIngredient:        (id, data)     => api.put(`/ingredients/${id}`, data),
  deleteIngredient:        (id)           => api.delete(`/ingredients/${id}`),
  getIngredientCategories: ()             => api.get('/ingredients/categories'),
};

export default recipeService;