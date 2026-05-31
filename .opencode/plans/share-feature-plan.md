# Share Feature Implementation Plan

## Overview
Add a share button that allows users to share the quiz on social media or via the Web Share API. The button should be accessible from any page (setup, quiz, completion).

## Implementation Details

### 1. HTML Modifications (index.html)
Add a fixed-position share button in the top-right corner:
```html
<button id="share-btn" class="fixed top-4 right-4 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg z-50 transition-all transform hover:scale-105" title="Share Quiz">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-.656 1.823-.656 2.588 0l.632.542a1.125 1.125 0 001.604 0l.632-.542a4.5 4.5 0 014.472 5.43l-.632.542a1.125 1.125 0 00-.38 1.604l.542.632a1.125 1.125 0 001.604-.38l.542-.632a7.5 7.5 0 01-5.43 4.472l-.542.632a1.125 1.125 0 00-.38 1.604l.632.542a1.125 1.125 0 001.604.38l.632-.542a4.5 4.5 0 015.43-4.472l.632.542a1.125 1.125 0 001.604-.38l.542.632a1.125 1.125 0 00-.38 1.604l-.632.542a7.5 7.5 0 01-4.472 5.43l-.542-.632a1.125 1.125 0 00-1.604-.38l-.542.632a1.125 1.125 0 00-.38 1.604l.632.542a1.125 1.125 0 001.604.38l.632-.542a4.5 4.5 0 01-4.472-5.43l-.632-.542a1.125 1.125 0 00-1.604-.38l-.542-.632a1.125 1.125 0 00-.38-1.604l-.632-.542a7.5 7.5 0 01-5.43-4.472l-.542.632a1.125 1.125 0 00-1.604.38l-.632-.542a1.125 1.125 0 00-.38-1.604l-.542-.632a4.5 4.5 0 01-5.43 4.472l-.632-.542a1.125 1.125 0 00-.38-1.604l-.542-.632a1.125 1.125 0 00-1.604.38l-.542.632a1.125 1.125 0 00.38 1.604l.632.542z" clip-rule="evenodd" />
    </svg>
</button>
```

### 2. JavaScript Implementation (script.js)
Add the following functions:

#### shareHandler function:
```javascript
function shareHandler() {
    // Prepare share data
    const shareData = {
        title: `Quiz Portal Pro - ${document.getElementById('module-label')?.textContent || 'Knowledge Challenge'}`,
        text: `I just scored ${document.getElementById('score-val')?.textContent || '0'} points on Quiz Portal Pro! Can you beat my score?`,
        url: window.location.href
    };

    // Try Web Share API first
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('Thanks for sharing!'))
            .catch((error) => console.log('Error sharing:', error));
    } else {
        // Fallback to social media sharing
        showSocialShareOptions();
    }
}

// Show social media sharing options
function showSocialShareOptions() {
    const currentUrl = encodeURIComponent(window.location.href);
    const score = document.getElementById('score-val')?.textContent || '0';
    const moduleLabel = document.getElementById('module-label')?.textContent || 'Knowledge Challenge';
    
    const shareText = encodeURIComponent(`I just scored ${score} points on Quiz Portal Pro! Can you beat my score? #QuizPortalPro`);
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold mb-4 text-center">Share Your Achievement</h3>
            <div class="space-y-4">
                <button onclick="shareToTwitter()" class="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                    </svg>
                    Twitter
                </button>
                <button onclick="shareToFacebook()" class="w-full p-3 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-lg flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.675 0h-20.5C1.004 0 0 1.004 0 2.252v19.496c0 1.248 1.004 2.252 2.252 2.252h12.018V14.46h-3.579v-3.669h3.579V9.582c0-3.008 1.892-4.788 4.659-4.788 1.325 0 2.468.099 2.645.113v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.31h3.587l-.467 3.669h-3.12v11.555c1.248 0 2.252-1.004 2.252-2.252V2.252c0-1.248-1.004-2.252-2.252-2.252z"/>
                    </svg>
                    Facebook
                </button>
                <button onclick="copyLink()" class="w-full p-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm5 3v11c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-1z"/>
                    </svg>
                    Copy Link
                </button>
                <button onclick="closeModal(this)" class="w-full p-3 bg-slate-300 hover:bg-slate-200 text-slate-800 rounded-lg">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Social media sharing functions
function shareToTwitter() {
    const score = document.getElementById('score-val')?.textContent || '0';
    const moduleLabel = document.getElementById('module-label')?.textContent || 'Knowledge Challenge';
    const shareText = encodeURIComponent(`I just scored ${score} points on Quiz Portal Pro! Can you beat my score? #QuizPortalPro`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${url}`, '_blank');
}

function shareToFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showNotify('Link Copied', 'Quiz link copied to clipboard!');
    }).catch(err => {
        showNotify('Copy Failed', 'Could not copy link to clipboard');
    });
}

function closeModal(button) {
    button.closest('.fixed').remove();
}
```

### 3. Event Listener
Add this in the initialization section of script.js:
```javascript
document.getElementById('share-btn')?.addEventListener('click', shareHandler);
```

### 4. CSS Considerations
Since we're using Tailwind CSS via CDN, no additional CSS is needed. The button uses utility classes for:
- Fixed positioning (top-4 right-4)
- Padding and sizing (p-3)
- Colors (bg-blue-600 hover:bg-blue-700 text-white)
- Shape (rounded-full)
- Effects (shadow-lg transition-all transform hover:scale-105)
- Z-index (z-50)

## Testing Plan
1. Verify share button appears on all pages (setup, quiz, completion)
2. Test Web Share API on supported browsers (Chrome, Firefox, Safari)
3. Test fallback social sharing on unsupported browsers
4. Verify share content includes current score and module info
5. Test copy link functionality
6. Ensure modal closes properly

## Files to Modify
1. `quiz/index.html` - Add share button HTML
2. `quiz/script.js` - Add shareHandler function and event listener

## Dependencies
- None additional (uses existing html2canvas and Tailwind CDN)