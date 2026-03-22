import React from 'react';
import { BookmarkIcon } from 'lucide-react';

function RecipeListItem({ recipe, isSelected, onSelect, showBookmark = false }) {
  return (
    <button
      onClick={onSelect}
      className={`recipe-list-item ${isSelected ? 'selected' : ''}`}
      aria-label={`Select recipe: ${recipe.title}`}
      aria-pressed={isSelected}
    >
      <div className="recipe-item-content">
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="recipe-image"
          loading="lazy"
        />
        <div className="recipe-info">
          <h3 className="recipe-title line-clamp-2">
            {recipe.title}
          </h3>
          <p className="recipe-publisher">{recipe.publisher}</p>
          {showBookmark && (
            <div className="bookmark-indicator">
              <BookmarkIcon size={12} />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default RecipeListItem;