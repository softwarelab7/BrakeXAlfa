import '../../styles/favorite-bookmark.css';

interface BookmarkProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    size?: number;
    animate?: boolean;
}

const Bookmark = ({ checked, onChange, size = 42, animate = true }: BookmarkProps) => {
    // Determine scale based on requested size vs original icon size (approx 24px)
    // The user's container is 42px, internal SVG is 24x22.
    // If size is provided (e.g. 18), we scale the whole thing.
    // Base scale on 24px (icon width) to match passed 'size' being the icon size.
    const scale = size ? size / 24 : 1;

    return (
        <div
            className={`like ${checked && animate ? 'liked' : ''} ${checked && !animate ? 'is-checked' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                onChange(!checked);
            }}
            style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center'
            }}
        >
            <svg width="24" height="22" viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.5 7.827C1.5 4.0992 3.5 1.5 7.54036 1.5C10 1.5 11.5646 2.93172 13.5323 5.5C15.5 8.06828 16 12 12 12C8 12 8.5 7.827 10.4677 5.5C12 3.5 14 1.5 16.4596 1.5C20.5 1.5 22.5 4.0992 22.5 7.827C22.5 14.5 12.525 20.5 12 20.5C11.475 20.5 1.5 14.5 1.5 7.827Z" stroke="#FF3040" strokeWidth="3" className="thread" />
                <path d="M1 7.66C1 12.235 4.899 16.746 10.987 20.594C11.325 20.797 11.727 21 12 21C12.283 21 12.686 20.797 13.013 20.594C19.1 16.746 23 12.234 23 7.66C23 3.736 20.245 1 16.672 1C14.603 1 12.98 1.94 12 3.352C11.042 1.952 9.408 1 7.328 1C3.766 1 1 3.736 1 7.66Z" strokeWidth="2" className="heart" />
            </svg>
        </div>
    );
}

export default Bookmark;
