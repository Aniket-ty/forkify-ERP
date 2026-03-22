import React, { useState, useEffect } from 'react';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import RecipeList from '../Recipe/RecipeList';
import RecipeDetail from '../Recipe/RecipeDetail';
import { BookmarkIcon, ChefHat, Loader } from 'lucide-react';
import StorageUtils from '../utils/storage';
import { Helmet } from "react-helmet-async";


function Bookmarks({ currentUser, onLogout, isSidebarOpen, setIsSidebarOpen }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const bookmarksPerPage = 10;

  useEffect(() => {
    if (currentUser?.email) {
      const savedBookmarks = StorageUtils.getBookmarks(currentUser.email);
      setBookmarks(savedBookmarks.map(bookmark => ({
        ...bookmark,
        isBookmarked: true
      })));
    }
  }, [currentUser?.email]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (currentUser?.email && e.key === `forkify_bookmarks_${currentUser.email}`) {
        const savedBookmarks = StorageUtils.getBookmarks(currentUser.email);
        setBookmarks(savedBookmarks.map(bookmark => ({
          ...bookmark,
          isBookmarked: true
        })));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser?.email]);

  const loadRecipeDetails = (recipeId) => {
    setRecipeLoading(true);
    
    setTimeout(() => {
      try {
        const bookmark = bookmarks.find(b => b.id === recipeId);
        if (bookmark) {
          setSelectedRecipe({ 
            ...bookmark, 
            isBookmarked: true 
          });
        } else {
          setSelectedRecipe(null);
        }
      } catch (err) {
        console.error('Failed to load recipe details:', err);
        setSelectedRecipe(null);
      } finally {
        setRecipeLoading(false);
      }
    }, 300);
  };

  const toggleBookmark = (recipe) => {
    if (!recipe || !recipe.id || !currentUser?.email) return;
    
    const updatedBookmarks = StorageUtils.removeBookmark(currentUser.email, recipe.id);
    setBookmarks(updatedBookmarks.map(bookmark => ({
      ...bookmark,
      isBookmarked: true
    })));
    
    if (selectedRecipe && selectedRecipe.id === recipe.id) {
      setSelectedRecipe(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const totalPages = Math.ceil(bookmarks.length / bookmarksPerPage);
  const startIndex = (currentPage - 1) * bookmarksPerPage;
  const currentBookmarks = bookmarks.slice(startIndex, startIndex + bookmarksPerPage);

  return (
    <div className="app-container">
      <Helmet>
        <title>Bookmarks | Forkify</title>
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
            searchQuery=""
            setSearchQuery={() => {}}
            handleSearch={handleSearch}
            currentUser={currentUser}
            onLogout={onLogout}
            onToggleMobileMenu={() => setIsSidebarOpen(!isSidebarOpen)}
            bookmarksCount={bookmarks.length}
          />

          <div className="main-grid">
            <div className="content-sidebar">
              <div className="sidebar-header">
                <h2>My Bookmarks ({bookmarks.length})</h2>
              </div>
              
              <div className="sidebar-content">
                {bookmarks.length === 0 ? (
                  <div className="empty-state">
                    <BookmarkIcon className="empty-icon" />
                    <p>No bookmarks yet!</p>
                    <p>Start saving your favorite recipes.</p>
                  </div>
                ) : (
                  <RecipeList
                    recipes={currentBookmarks}
                    selectedRecipeId={selectedRecipe?.id}
                    onSelectRecipe={loadRecipeDetails}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    showBookmarkIcon={true}
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
                    showRemoveOption={true}
                  />
                ) : (
                  <div className="empty-state">
                    <ChefHat className="empty-icon" />
                    <p className="text-xl">Select a bookmark to view</p>
                    <p>Click on any recipe from your bookmarks</p>
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

export default Bookmarks;