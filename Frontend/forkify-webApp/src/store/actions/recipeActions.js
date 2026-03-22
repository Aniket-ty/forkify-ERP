import recipeService from '../../services/recipeService';

export const RECIPES_LOADING  = 'RECIPES_LOADING';
export const RECIPES_SUCCESS  = 'RECIPES_SUCCESS';
export const RECIPE_DETAIL    = 'RECIPE_DETAIL';
export const RECIPES_ERROR    = 'RECIPES_ERROR';
export const RECIPE_CREATED   = 'RECIPE_CREATED';
export const RECIPE_UPDATED   = 'RECIPE_UPDATED';
export const RECIPE_DELETED   = 'RECIPE_DELETED';
export const RECIPES_CLEAR_ERROR = 'RECIPES_CLEAR_ERROR';
export const INGREDIENTS_SUCCESS = 'INGREDIENTS_SUCCESS';

const extractMsg = (err, fallback) => {
  const d = err.response?.data;
  if (!d) return fallback;
  if (typeof d === 'string') return d;
  if (d.message) return d.message;
  return fallback;
};

// ── Fetch list ────────────────────────────────────────────────────────────────
export const fetchRecipes = (params = {}) => async (dispatch) => {
  dispatch({ type: RECIPES_LOADING });
  try {
    const { data } = await recipeService.getAll(params);
    dispatch({ type: RECIPES_SUCCESS, payload: data });
  } catch (err) {
    dispatch({ type: RECIPES_ERROR, payload: extractMsg(err, 'Failed to load recipes') });
  }
};

// ── Fetch single ──────────────────────────────────────────────────────────────
export const fetchRecipeById = (id) => async (dispatch) => {
  dispatch({ type: RECIPES_LOADING });
  try {
    const { data } = await recipeService.getById(id);
    dispatch({ type: RECIPE_DETAIL, payload: data });
  } catch (err) {
    dispatch({ type: RECIPES_ERROR, payload: extractMsg(err, 'Failed to load recipe') });
  }
};

// ── Create ────────────────────────────────────────────────────────────────────
export const createRecipe = (recipeData) => async (dispatch) => {
  dispatch({ type: RECIPES_LOADING });
  try {
    const { data } = await recipeService.create(recipeData);
    dispatch({ type: RECIPE_CREATED, payload: data });
    return { success: true, data };
  } catch (err) {
    const msg = extractMsg(err, 'Failed to create recipe');
    dispatch({ type: RECIPES_ERROR, payload: msg });
    return { success: false, error: msg };
  }
};

// ── Update ────────────────────────────────────────────────────────────────────
export const updateRecipe = (id, recipeData) => async (dispatch) => {
  dispatch({ type: RECIPES_LOADING });
  try {
    const { data } = await recipeService.update(id, recipeData);
    dispatch({ type: RECIPE_UPDATED, payload: data });
    return { success: true, data };
  } catch (err) {
    const msg = extractMsg(err, 'Failed to update recipe');
    dispatch({ type: RECIPES_ERROR, payload: msg });
    return { success: false, error: msg };
  }
};

// ── Delete ────────────────────────────────────────────────────────────────────
export const deleteRecipe = (id) => async (dispatch) => {
  try {
    await recipeService.delete(id);
    dispatch({ type: RECIPE_DELETED, payload: id });
    return { success: true };
  } catch (err) {
    const msg = extractMsg(err, 'Failed to delete recipe');
    dispatch({ type: RECIPES_ERROR, payload: msg });
    return { success: false, error: msg };
  }
};

// ── Ingredients ───────────────────────────────────────────────────────────────
export const fetchIngredients = (params = {}) => async (dispatch) => {
  try {
    const { data } = await recipeService.getAllIngredients(params);
    dispatch({ type: INGREDIENTS_SUCCESS, payload: data });
  } catch (err) {
    // non-critical — don't block UI
    console.error('Failed to load ingredients', err);
  }
};

export const clearRecipeError = () => ({ type: RECIPES_CLEAR_ERROR });