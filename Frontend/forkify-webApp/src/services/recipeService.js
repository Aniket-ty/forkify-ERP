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

  // Recipe Steps — backend stores steps in a separate table via /recipes/{id}/steps
  getSteps:      (recipeId)             => api.get(`/recipes/${recipeId}/steps`),
  createStep:    (recipeId, stepData)   => api.post(`/recipes/${recipeId}/steps`, stepData),
  updateStep:    (recipeId, stepId, stepData) => api.put(`/recipes/${recipeId}/steps/${stepId}`, stepData),
  deleteStep:    (recipeId, stepId)     => api.delete(`/recipes/${recipeId}/steps/${stepId}`),
  deleteAllSteps:(recipeId)             => api.delete(`/recipes/${recipeId}/steps`),

  // Recipe Version Snapshots — saves current recipe state as a named version
  saveSnapshot:  (recipeId, summary)    => api.post(`/recipe-versions/${recipeId}/snapshot`, { summary }),

  // Ingredients
  getAllIngredients:        (params = {}) => api.get('/ingredients', { params }),
  getIngredientById:       (id)           => api.get(`/ingredients/${id}`),
  createIngredient:        (data)         => api.post('/ingredients', data),
  updateIngredient:        (id, data)     => api.put(`/ingredients/${id}`, data),
  deleteIngredient:        (id)           => api.delete(`/ingredients/${id}`),
  getIngredientCategories: ()             => api.get('/ingredients/categories'),
};

export default recipeService;