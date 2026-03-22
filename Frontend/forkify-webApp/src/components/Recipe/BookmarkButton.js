import React from 'react';
import { BookmarkIcon } from 'lucide-react';

function BookmarkButton({ isBookmarked, onClick, size = 'medium', showLabel = false }) {
  const sizes = {
    small: {
      button: 'btn-icon-small',
      icon: 'w-4 h-4'
    },
    medium: {
      button: 'btn-icon',
      icon: 'w-5 h-5'
    },
    large: {
      button: 'btn-icon-large',
      icon: 'w-6 h-6'
    }
  };

  const { button: buttonSize, icon: iconSize } = sizes[size];

  return (
    <button
      onClick={onClick}
      className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''} ${buttonSize}`}
      aria-label={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
      aria-pressed={isBookmarked}
    >
      <BookmarkIcon className={`bookmark-icon ${iconSize}`} fill={isBookmarked ? 'currentColor' : 'none'} />
      {showLabel && (
        <span className="bookmark-label ml-2">
          {isBookmarked ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
}

export default BookmarkButton;