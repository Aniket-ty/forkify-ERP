// Utility functions for localStorage management
export const StorageUtils = {
  // Get bookmarks for a specific user
  getBookmarks: (userEmail) => {
    try {
      const savedBookmarks = localStorage.getItem(`forkify_bookmarks_${userEmail}`);
      return savedBookmarks ? JSON.parse(savedBookmarks) : [];
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  },

  // Save bookmarks for a specific user
  saveBookmarks: (userEmail, bookmarks) => {
    try {
      localStorage.setItem(`forkify_bookmarks_${userEmail}`, JSON.stringify(bookmarks));
      return true;
    } catch (error) {
      console.error('Error saving bookmarks:', error);
      return false;
    }
  },

  // Add a single bookmark
  addBookmark: (userEmail, recipe) => {
    const bookmarks = StorageUtils.getBookmarks(userEmail);
    const isBookmarked = bookmarks.some(b => b.id === recipe.id);
    
    if (!isBookmarked) {
      const cleanRecipe = {
        id: recipe.id,
        title: recipe.title,
        publisher: recipe.publisher,
        image_url: recipe.image_url,
        cooking_time: recipe.cooking_time,
        servings: recipe.servings,
        source_url: recipe.source_url,
        ingredients: recipe.ingredients,
        originalServings: recipe.originalServings || recipe.servings,
        originalIngredients: recipe.originalIngredients || recipe.ingredients
      };
      
      bookmarks.push(cleanRecipe);
      StorageUtils.saveBookmarks(userEmail, bookmarks);
      return true;
    }
    return false;
  },

  // Remove a single bookmark
  removeBookmark: (userEmail, recipeId) => {
    const bookmarks = StorageUtils.getBookmarks(userEmail);
    const updatedBookmarks = bookmarks.filter(b => b.id !== recipeId);
    StorageUtils.saveBookmarks(userEmail, updatedBookmarks);
    return updatedBookmarks;
  },

  // Check if a recipe is bookmarked
  isBookmarked: (userEmail, recipeId) => {
    const bookmarks = StorageUtils.getBookmarks(userEmail);
    return bookmarks.some(b => b.id === recipeId);
  },

  // Clear all bookmarks for a user
  clearBookmarks: (userEmail) => {
    localStorage.removeItem(`forkify_bookmarks_${userEmail}`);
  },

  // Get total bookmark count
  getBookmarkCount: (userEmail) => {
    const bookmarks = StorageUtils.getBookmarks(userEmail);
    return bookmarks.length;
  }
};

export default StorageUtils;