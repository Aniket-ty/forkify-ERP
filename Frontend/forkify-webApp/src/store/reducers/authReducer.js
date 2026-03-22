import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_FAILURE,
  LOGOUT,
  CLEAR_ERROR,
  SET_ACTIVE_BRANCH,
} from '../actions/authActions';

// Hydrate from localStorage so a page refresh keeps the user logged in
const storedUser = (() => {
  try { return JSON.parse(localStorage.getItem('user')); }
  catch { return null; }
})();

const initialState = {
  token:           localStorage.getItem('token') || null,
  user:            storedUser,                        // { id, username, email, fullName, role, branchId, branchName }
  isAuthenticated: !!localStorage.getItem('token'),
  loading:         false,
  error:           null,
  message:         null,
};

export const authReducer = (state = initialState, action) => {
  switch (action.type) {

    case LOGIN_REQUEST:
    case REGISTER_REQUEST:
      return { ...state, loading: true, error: null, message: null };

    case LOGIN_SUCCESS:
      return {
        ...state,
        token:           action.payload.token,
        user:            action.payload.user,
        isAuthenticated: true,
        loading:         false,
        error:           null,
      };

    case REGISTER_SUCCESS:
      return { ...state, loading: false, error: null, message: action.payload };

    case LOGIN_FAILURE:
    case REGISTER_FAILURE:
      return {
        ...state,
        token:           null,
        user:            null,
        isAuthenticated: false,
        loading:         false,
        error:           action.payload,
      };

    case LOGOUT:
      return {
        ...state,
        token:           null,
        user:            null,
        isAuthenticated: false,
        loading:         false,
        error:           null,
      };

    case CLEAR_ERROR:
      return { ...state, error: null, message: null };

    case SET_ACTIVE_BRANCH:
      // Updates branchId + branchName in Redux AND localStorage so all
      // API calls pick up the new context automatically via useBranch()
      const updatedUser = {
        ...state.user,
        branchId:   action.payload.branchId,
        branchName: action.payload.branchName,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { ...state, user: updatedUser };

    default:
      return state;
  }
};