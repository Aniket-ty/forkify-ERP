// src/store/index.js — Redux store (RTK)
import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, recipeService } from '../services';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const initAuthThunk = createAsyncThunk('auth/init', async () => {
  try {
    const token   = await AsyncStorage.getItem('token');
    const userStr = await AsyncStorage.getItem('user');
    if (!token) return null;
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  } catch {
    return null;
  }
});

export const loginThunk = createAsyncThunk('auth/login', async ({ username, password }, { rejectWithValue }) => {
  try {
    const { data } = await authService.login(username, password);
    const user = {
      id: data.id, username: data.username, email: data.email,
      fullName: data.fullName, role: data.role,
      branchId: data.branchId, branchName: data.branchName,
    };
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return { token: data.token, user };
  } catch (error) {
    const d   = error.response?.data;
    const msg = d?.errors?.[0]?.defaultMessage || d?.message || (typeof d === 'string' ? d : 'Login failed');
    return rejectWithValue(msg);
  }
});

export const registerThunk = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    await authService.register(userData);
    return true;
  } catch (error) {
    const d   = error.response?.data;
    const msg = d?.errors?.[0]?.defaultMessage || d?.message || (typeof d === 'string' ? d : 'Registration failed');
    return rejectWithValue(msg);
  }
});

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.multiRemove(['token', 'user']);
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null, user: null, isAuthenticated: false,
    loading: false, initialized: false, error: null, message: null,
  },
  reducers: {
    clearError:      (state) => { state.error = null; state.message = null; },
    setActiveBranch: (state, action) => {
      if (state.user) {
        state.user.branchId   = action.payload.branchId;
        state.user.branchName = action.payload.branchName;
        AsyncStorage.setItem('user', JSON.stringify(state.user)).catch(() => {});
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // init
      .addCase(initAuthThunk.pending,   (s) => { s.loading = true; })
      .addCase(initAuthThunk.fulfilled, (s, a) => {
        s.loading = false; s.initialized = true;
        if (a.payload) { s.token = a.payload.token; s.user = a.payload.user; s.isAuthenticated = true; }
      })
      .addCase(initAuthThunk.rejected,  (s) => { s.loading = false; s.initialized = true; })
      // login
      .addCase(loginThunk.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(loginThunk.fulfilled, (s, a) => { s.loading = false; s.token = a.payload.token; s.user = a.payload.user; s.isAuthenticated = true; })
      .addCase(loginThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      // register
      .addCase(registerThunk.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(registerThunk.fulfilled, (s) => { s.loading = false; s.message = 'Registration successful!'; })
      .addCase(registerThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      // logout
      .addCase(logoutThunk.fulfilled, (s) => {
        s.token = null; s.user = null; s.isAuthenticated = false;
        s.error = null; s.message = null;
      });
  },
});

// ── Recipes ───────────────────────────────────────────────────────────────────
export const fetchRecipesThunk = createAsyncThunk('recipes/fetchAll', async (params = {}, { rejectWithValue }) => {
  try { const { data } = await recipeService.getAll(params); return data; }
  catch { return rejectWithValue('Failed to load recipes'); }
});

export const fetchRecipeByIdThunk = createAsyncThunk('recipes/fetchById', async (id, { rejectWithValue }) => {
  try { const { data } = await recipeService.getById(id); return data; }
  catch { return rejectWithValue('Failed to load recipe'); }
});

export const deleteRecipeThunk = createAsyncThunk('recipes/delete', async (id, { rejectWithValue }) => {
  try { await recipeService.delete(id); return id; }
  catch { return rejectWithValue('Failed to delete recipe'); }
});

const recipeSlice = createSlice({
  name: 'recipes',
  initialState: { recipes: [], selected: null, loading: false, error: null },
  reducers: { clearRecipeError: (s) => { s.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecipesThunk.pending,      (s) => { s.loading = true; s.error = null; })
      .addCase(fetchRecipesThunk.fulfilled,    (s, a) => { s.loading = false; s.recipes = a.payload; })
      .addCase(fetchRecipesThunk.rejected,     (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchRecipeByIdThunk.pending,   (s) => { s.loading = true; })
      .addCase(fetchRecipeByIdThunk.fulfilled, (s, a) => { s.loading = false; s.selected = a.payload; })
      .addCase(fetchRecipeByIdThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(deleteRecipeThunk.fulfilled,    (s, a) => { s.recipes = s.recipes.filter(r => r.id !== a.payload); });
  },
});

// ── Exports ───────────────────────────────────────────────────────────────────
export const { clearError, setActiveBranch } = authSlice.actions;
export const { clearRecipeError }            = recipeSlice.actions;

const store = configureStore({
  reducer: { auth: authSlice.reducer, recipes: recipeSlice.reducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
