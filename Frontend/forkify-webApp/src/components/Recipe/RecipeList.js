import React from 'react';
import RecipeListItem from './RecipeListItem';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function RecipeList({ 
  recipes, 
  selectedRecipeId, 
  onSelectRecipe, 
  totalPages, 
  currentPage, 
  onPageChange,
  showBookmarkIcon = false 
}) {
  if (!recipes || recipes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🍳</div>
        <p>No recipes found</p>
        <p>Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="recipe-list-container">
      <div className="recipe-list">
        {recipes.map((recipe) => (
          <RecipeListItem
            key={recipe.id}
            recipe={recipe}
            isSelected={selectedRecipeId === recipe.id}
            onSelect={() => onSelectRecipe(recipe.id)}
            showBookmark={showBookmarkIcon || recipe.isBookmarked}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="pagination-button"
            aria-label="Previous page"
          >
            <ChevronLeft />
            <span>Prev</span>
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="pagination-button"
            aria-label="Next page"
          >
            <span>Next</span>
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}

export default RecipeList;