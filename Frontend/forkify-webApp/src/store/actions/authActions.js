import authService from '../../services/authService';

export const LOGIN_REQUEST    = 'LOGIN_REQUEST';
export const LOGIN_SUCCESS    = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE    = 'LOGIN_FAILURE';
export const REGISTER_REQUEST = 'REGISTER_REQUEST';
export const REGISTER_SUCCESS = 'REGISTER_SUCCESS';
export const REGISTER_FAILURE = 'REGISTER_FAILURE';
export const LOGOUT           = 'LOGOUT';
export const CLEAR_ERROR      = 'CLEAR_ERROR';
export const SET_ACTIVE_BRANCH = 'SET_ACTIVE_BRANCH';

// ── Helper: always returns a plain string from any error shape ────────────────
const extractErrorMessage = (error, fallback) => {
  const data = error.response?.data;
  if (!data) return fallback;
  // Spring Boot validation error: { errors: [{defaultMessage}] }
  if (data.errors?.[0]?.defaultMessage) return data.errors[0].defaultMessage;
  // Spring Boot standard error: { message: "..." }
  if (typeof data.message === 'string') return data.message;
  // Plain string body (e.g. "Error: Username already taken!")
  if (typeof data === 'string') return data;
  // Fallback — never return an object
  return fallback;
};

// ── Login ─────────────────────────────────────────────────────────────────────
// Accepts EITHER:  login({ username, password })
//            OR:   login(username, password)
// This makes it backwards-compatible with the existing Login.js call style
export const login = (usernameOrObject, passwordArg) => async (dispatch) => {
  const username = typeof usernameOrObject === 'object'
    ? usernameOrObject.username
    : usernameOrObject;
  const password = typeof usernameOrObject === 'object'
    ? usernameOrObject.password
    : passwordArg;

  try {
    dispatch({ type: LOGIN_REQUEST });

    const { data } = await authService.login(username, password);
    const { token, id, username: uname, email, fullName, role, branchId, branchName } = data;

    localStorage.removeItem('forkify_token');
    localStorage.removeItem('forkify_user');
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({
      id, username: uname, email, fullName, role, branchId, branchName,
    }));

    dispatch({
      type: LOGIN_SUCCESS,
      payload: {
        token,
        user: { id, username: uname, email, fullName, role, branchId, branchName },
      },
    });

    return true;
  } catch (error) {
    dispatch({
      type: LOGIN_FAILURE,
      payload: extractErrorMessage(error, 'Login failed. Please check your credentials.'),
    });
    return false;
  }
};

// ── Register ──────────────────────────────────────────────────────────────────
export const register = (userData) => async (dispatch) => {
  try {
    dispatch({ type: REGISTER_REQUEST });

    await authService.register({
      username: userData.username,
      email:    userData.email,
      password: userData.password,
      fullName: userData.fullName,
    });

    dispatch({
      type: REGISTER_SUCCESS,
      payload: 'Registration successful! You can now log in.',
    });

    return true;
  } catch (error) {
    dispatch({
      type: REGISTER_FAILURE,
      payload: extractErrorMessage(error, 'Registration failed. Please try again.'),
    });
    return false;
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
export const logout = () => (dispatch) => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  dispatch({ type: LOGOUT });
};

// ── Clear Error ───────────────────────────────────────────────────────────────
export const clearError = () => ({ type: CLEAR_ERROR });

// ── Switch active branch (admin only — for viewing other branches) ─────────────
export const setActiveBranch = (branchId, branchName) => ({
  type: SET_ACTIVE_BRANCH,
  payload: { branchId, branchName },
});