import React from 'react';
import '../../styles/favorite-bookmark.css';

interface BookmarkProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    size?: number;
}

const Bookmark = ({ checked, onChange, size = 25 }: BookmarkProps) => {
    return (
        <div className="ui-bookmark-wrapper">
            <label className="ui-bookmark" style={{ '--icon-size': `${size}px` } as React.CSSProperties}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="bookmark">
                    <svg
                        viewBox="0 0 16 16"
                        className="bi bi-heart-fill"
                        height={size}
                        width={size}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" fillRule="evenodd" />
                    </svg>
                </div>
            </label>
        </div>
    );
}

export default Bookmark;
