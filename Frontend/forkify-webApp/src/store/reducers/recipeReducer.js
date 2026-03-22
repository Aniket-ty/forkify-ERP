import {
  RECIPES_LOADING,
  RECIPES_SUCCESS,
  RECIPE_DETAIL,
  RECIPES_ERROR,
  RECIPE_CREATED,
  RECIPE_UPDATED,
  RECIPE_DELETED,
  RECIPES_CLEAR_ERROR,
  INGREDIENTS_SUCCESS,
} from '../actions/recipeActions';

const initialState = {
  recipes:     [],
  selected:    null,
  ingredients: [],
  loading:     false,
  error:       null,
};

export const recipeReducer = (state = initialState, action) => {
  switch (action.type) {

    case RECIPES_LOADING:
      return { ...state, loading: true, error: null };

    case RECIPES_SUCCESS:
      return { ...state, loading: false, recipes: action.payload };

    case RECIPE_DETAIL:
      return { ...state, loading: false, selected: action.payload };

    case RECIPE_CREATED:
      return { ...state, loading: false, recipes: [action.payload, ...state.recipes] };

    case RECIPE_UPDATED:
      return {
        ...state,
        loading: false,
        selected: action.payload,
        recipes: state.recipes.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
      };

    case RECIPE_DELETED:
      return {
        ...state,
        recipes:  state.recipes.filter(r => r.id !== action.payload),
        selected: state.selected?.id === action.payload ? null : state.selected,
      };

    case RECIPES_ERROR:
      return { ...state, loading: false, error: action.payload };

    case RECIPES_CLEAR_ERROR:
      return { ...state, error: null };

    case INGREDIENTS_SUCCESS:
      return { ...state, ingredients: action.payload };

    default:
      return state;
  }
};