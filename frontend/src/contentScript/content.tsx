import { createRoot } from 'react-dom/client';
import App from '../App.tsx';
import tailwindCss from '../index.css?inline';

// Create a container div for the React app
const extensionRoot = document.createElement('div');
extensionRoot.id = 'anotationblog-extension-root';

// Apply basic styles to the container
extensionRoot.style.position = 'fixed';
extensionRoot.style.top = '10px';
extensionRoot.style.right = '10px';
extensionRoot.style.zIndex = '999999';
extensionRoot.style.transition = 'top 0.2s, left 0.2s, transform 0.2s';

document.body.appendChild(extensionRoot);

// Attach Shadow DOM
const shadowRoot = extensionRoot.attachShadow({ mode: 'open' });

// Inject Tailwind CSS
const styleElement = document.createElement('style');
styleElement.textContent = tailwindCss;
shadowRoot.appendChild(styleElement);

// Create render root inside Shadow DOM
const renderRoot = document.createElement('div');
shadowRoot.appendChild(renderRoot);

// Render the application into the shadow root
createRoot(renderRoot).render(
    <App />
);

// Add current corner state
const currentCorner = { vertical: 'top', horizontal: 'right' };

window.addEventListener('anotationblog-start-drag', (e: Event) => {
    e.preventDefault();
    const detail = (e as CustomEvent).detail;
    extensionRoot.style.transition = 'none';

    // We get initial mouse offset to correctly hold the element relative to cursor
    const startX = detail.clientX;
    const startY = detail.clientY;

    const rect = extensionRoot.getBoundingClientRect();
    const offsetX = startX - rect.left;
    const offsetY = startY - rect.top;

    const onMouseMove = (moveEvent: MouseEvent) => {
        extensionRoot.style.position = 'fixed';
        extensionRoot.style.top = `${moveEvent.clientY - offsetY}px`;
        extensionRoot.style.left = `${moveEvent.clientX - offsetX}px`;
        extensionRoot.style.right = 'auto';
        extensionRoot.style.bottom = 'auto';
        extensionRoot.style.transform = 'none';
    };

    const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        // Re-enable transition for smooth snap
        extensionRoot.style.transition = 'top 0.3s, left 0.3s, bottom 0.3s, right 0.3s, transform 0.2s';

        // Snap logic: calculate screen middle
        const screenMiddleX = window.innerWidth / 2;
        const screenMiddleY = window.innerHeight / 2;

        const rect = extensionRoot.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        currentCorner.horizontal = centerX < screenMiddleX ? 'left' : 'right';
        currentCorner.vertical = centerY < screenMiddleY ? 'top' : 'bottom';

        snapToCurrentCorner();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
});

const snapToCurrentCorner = () => {
    extensionRoot.style.position = 'fixed';
    extensionRoot.style.transform = 'none';

    if (currentCorner.vertical === 'top') {
        extensionRoot.style.top = '10px';
        extensionRoot.style.bottom = 'auto';
    } else {
        extensionRoot.style.bottom = '10px';
        extensionRoot.style.top = 'auto';
    }

    if (currentCorner.horizontal === 'left') {
        extensionRoot.style.left = '10px';
        extensionRoot.style.right = 'auto';
    } else {
        extensionRoot.style.right = '10px';
        extensionRoot.style.left = 'auto';
    }
};

// Default setup
snapToCurrentCorner();

// Listen for text selection to move the pop-up
document.addEventListener('mouseup', (e) => {
    // Ignore clicks inside the extension itself
    if (extensionRoot.contains(e.target as Node)) return;

    const target = e.target as HTMLElement;
    const highlightEl = target.closest ? target.closest('.anotationblog-highlight') : null;

    let rect = null;
    let isActive = false;

    if (highlightEl) {
        rect = highlightEl.getBoundingClientRect();
        isActive = true;
    } else {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            rect = range.getBoundingClientRect();
            isActive = true;
        }
    }

    if (isActive && rect) {
        // Detach and use absolute coordinates tied to the page's scroll height
        extensionRoot.style.position = 'absolute';

        // Remove bottom/right pins from corner logic
        extensionRoot.style.bottom = 'auto';
        extensionRoot.style.right = 'auto';

        // Check if there is enough room below the selection
        if (rect.bottom + 450 > window.innerHeight) {
            // Not enough room below: Position ABOVE the text!
            extensionRoot.style.top = `${window.scrollY + rect.top - 10}px`;
            extensionRoot.style.transform = `translateY(-100%)`;
        } else {
            // Enough room below: Position normally underneath
            extensionRoot.style.top = `${window.scrollY + rect.bottom + 10}px`;
            extensionRoot.style.transform = `none`;
        }

        // Prevent it from overflowing the right edge
        let leftPos = window.scrollX + rect.left;
        if (leftPos + 400 > window.innerWidth) {
            leftPos = window.innerWidth - 400;
        }

        extensionRoot.style.left = `${leftPos > 0 ? leftPos : 10}px`;
    } else {
        // Nothing selected - Dock it back to the saved corner
        snapToCurrentCorner();
        window.dispatchEvent(new CustomEvent('anotationblog-reset-view'));
    }
});

