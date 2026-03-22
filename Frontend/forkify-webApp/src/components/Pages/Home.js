import React, { useState, useEffect } from 'react';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import RecipeList from '../Recipe/RecipeList';
import RecipeDetail from '../Recipe/RecipeDetail';
import { Loader, ChefHat, Search, AlertCircle } from 'lucide-react';
import StorageUtils from '../utils/storage';
import { Helmet } from "react-helmet-async";


const API_URL = 'https://forkify-api.herokuapp.com/api/v2/recipes';
const API_KEY = '9e7ba24e-6cda-4995-853e-2b0d089538f0';

function Home({ currentUser, onLogout, isSidebarOpen, setIsSidebarOpen }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const recipesPerPage = 10;

  useEffect(() => {
    if (currentUser?.email) {
      const savedBookmarks = StorageUtils.getBookmarks(currentUser.email);
      setBookmarks(savedBookmarks);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (currentUser?.email && e.key === `forkify_bookmarks_${currentUser.email}`) {
        const savedBookmarks = StorageUtils.getBookmarks(currentUser.email);
        setBookmarks(savedBookmarks);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser?.email]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const response = await fetch(`${API_URL}?search=${searchQuery}&key=${API_KEY}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setRecipes(data.data.recipes || []);
        if (data.data.recipes && data.data.recipes.length > 0) {
          loadRecipeDetails(data.data.recipes[0].id);
        } else {
          setSelectedRecipe(null);
        }
      } else {
        setError('No recipes found. Try another search!');
        setRecipes([]);
        setSelectedRecipe(null);
      }
    } catch (err) {
      setError('Failed to fetch recipes. Please try again.');
      setRecipes([]);
      setSelectedRecipe(null);
    } finally {
      setLoading(false);
    }
  };
  
  const loadRecipeDetails = async (recipeId) => {
    setRecipeLoading(true);
    try {
      const response = await fetch(`${API_URL}/${recipeId}?key=${API_KEY}`);
      const data = await response.json();
      
      if (data.status === 'success' && data.data && data.data.recipe) {
        const recipe = data.data.recipe;
        const isBookmarked = currentUser?.email 
          ? StorageUtils.isBookmarked(currentUser.email, recipe.id)
          : false;
        
        const ingredients = Array.isArray(recipe.ingredients) 
          ? recipe.ingredients.map(ing => ({
              ...ing,
              quantity: ing.quantity !== null ? ing.quantity : undefined
            }))
          : [];
        
        setSelectedRecipe({ 
          ...recipe, 
          isBookmarked,
          originalServings: recipe.servings || 1,
          originalIngredients: ingredients.map(ing => ({
            ...ing,
            originalQuantity: ing.quantity !== undefined ? ing.quantity : 0
          })),
          ingredients: ingredients
        });
      } else {
        console.error('Invalid recipe data structure:', data);
        setSelectedRecipe(null);
      }
    } catch (err) {
      console.error('Failed to load recipe details:', err);
      setSelectedRecipe(null);
    } finally {
      setRecipeLoading(false);
    }
  };

  const toggleBookmark = (recipe) => {
    if (!recipe || !recipe.id || !currentUser?.email) return;
    
    const isBookmarked = StorageUtils.isBookmarked(currentUser.email, recipe.id);
    
    if (isBookmarked) {
      const updatedBookmarks = StorageUtils.removeBookmark(currentUser.email, recipe.id);
      setBookmarks(updatedBookmarks);
    } else {
      StorageUtils.addBookmark(currentUser.email, recipe);
      const updatedBookmarks = StorageUtils.getBookmarks(currentUser.email);
      setBookmarks(updatedBookmarks);
    }
    
    if (selectedRecipe && selectedRecipe.id === recipe.id) {
      setSelectedRecipe(prev => ({ 
        ...prev, 
        isBookmarked: !isBookmarked 
      }));
    }
  };

  const totalPages = Math.ceil(recipes.length / recipesPerPage);
  const startIndex = (currentPage - 1) * recipesPerPage;
  const currentRecipes = recipes.slice(startIndex, startIndex + recipesPerPage);

  return (
    <div className="app-container">
      <Helmet>
        <title>Home | Forkify</title>
      </Helmet>
      
      <Sidebar 
        currentUser={currentUser}
        onLogout={onLogout}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="main-wrapper">
          <Header 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            currentUser={currentUser}
            onLogout={onLogout}
            onToggleMobileMenu={() => setIsSidebarOpen(!isSidebarOpen)}
            bookmarksCount={bookmarks.length}
          />

          <div className="main-grid">
            <div className="content-sidebar">
              <div className="sidebar-header">
                <h2>Search Results</h2>
              </div>
              
              <div className="sidebar-content">
                {loading ? (
                  <div className="loading-container">
                    <Loader className="loading-spinner" />
                    <p>Loading recipes...</p>
                  </div>
                ) : error ? (
                  <div className="empty-state">
                    <AlertCircle className="empty-icon" />
                    <p>{error}</p>
                  </div>
                ) : recipes.length === 0 ? (
                  <div className="empty-state">
                    <Search className="empty-icon" />
                    <p>Search for amazing recipes!</p>
                    <p>Try "pizza", "pasta", or "chicken"</p>
                  </div>
                ) : (
                  <RecipeList
                    recipes={currentRecipes}
                    selectedRecipeId={selectedRecipe?.id}
                    onSelectRecipe={loadRecipeDetails}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            </div>

            <div className="recipe-detail-wrapper">
              <div className="recipe-detail">
                {recipeLoading ? (
                  <div className="loading-container">
                    <Loader className="loading-spinner" />
                    <p>Loading recipe details...</p>
                  </div>
                ) : selectedRecipe ? (
                  <RecipeDetail 
                    recipe={selectedRecipe} 
                    onToggleBookmark={toggleBookmark}
                  />
                ) : (
                  <div className="empty-state">
                    <ChefHat className="empty-icon" />
                    <p className="text-xl">Start by searching for a recipe</p>
                    <p>or an ingredient. Have fun!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;