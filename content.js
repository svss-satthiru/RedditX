// RedditX - Content Script

class RedditPromotedDetector {
  constructor() {
    this.promotedPosts = new Set();
    this.observer = null;
  }

  // Debug function to inspect post structure
  debugPostStructure() {
    const samplePost = document.querySelector('shreddit-post');
    if (samplePost) {
      console.log('[RedditX] [DEBUG] Sample shreddit-post attributes:');
      for (let attr of samplePost.attributes) {
        console.log(`[RedditX]   ${attr.name}: ${attr.value}`);
      }
      console.log('[RedditX] [DEBUG] Sample post HTML (first 500 chars):', samplePost.innerHTML.substring(0, 500));
    }

    // Check for any elements with "promoted" in their attributes
    const elementsWithPromoted = document.querySelectorAll('*');
    const promotedElements = [];
    elementsWithPromoted.forEach(el => {
      for (let attr of el.attributes || []) {
        if (attr.name.toLowerCase().includes('promo') || attr.value.toLowerCase().includes('promo')) {
          promotedElements.push({ tag: el.tagName, attr: attr.name, value: attr.value });
          if (promotedElements.length < 5) {
            console.log(`[RedditX] [DEBUG] Found element with promo: <${el.tagName} ${attr.name}="${attr.value}">`);
          }
        }
      }
    });
  }

  // Detect promoted posts using various methods
  detectPromotedPosts() {
    const promoted = [];

    console.log('[RedditX] Scanning for promoted content...');

    // Method 1: Check shreddit-post elements with is-promoted attribute (new Reddit)
    const shredditPromoted = document.querySelectorAll('shreddit-post[is-promoted="true"]');
    console.log(`[RedditX] [Method 1] Found ${shredditPromoted.length} shreddit-post[is-promoted="true"]`);
    shredditPromoted.forEach(post => promoted.push(post));

    // Method 2: Look for promoted badge in post metadata
    const promotedBadges = document.querySelectorAll('[data-testid="post-container"]');
    promotedBadges.forEach(container => {
      const textContent = container.textContent || '';
      if (textContent.includes('Promoted')) {
        console.log('[RedditX] [Method 2] Found promoted post by text content');
        promoted.push(container);
      }
    });

    // Method 3: Check for data-promoted attribute (old Reddit style)
    const dataPromoted = document.querySelectorAll('[data-promoted="true"]');
    console.log(`[RedditX] [Method 3] Found ${dataPromoted.length} [data-promoted="true"]`);
    dataPromoted.forEach(post => promoted.push(post));

    // Method 4: Check for promoted class
    const promotedClass = document.querySelectorAll('.promoted, .promotedlink');
    console.log(`[RedditX] [Method 4] Found ${promotedClass.length} elements with .promoted or .promotedlink class`);
    promotedClass.forEach(post => promoted.push(post));

    // Method 5: Check all shreddit-post elements for "Promoted" text in their content
    const allShredditPosts = document.querySelectorAll('shreddit-post');
    console.log(`[RedditX] [Method 5] Checking ${allShredditPosts.length} shreddit-post elements for "Promoted" text`);
    allShredditPosts.forEach(post => {
      const textContent = post.textContent || '';
      if (textContent.includes('Promoted')) {
        console.log('[RedditX] [Method 5] Found promoted shreddit-post by text match');
        promoted.push(post);
      }
    });

    // Remove duplicates
    const uniquePromoted = [...new Set(promoted)];
    console.log(`[RedditX] Total promoted posts found: ${uniquePromoted.length}`);

    return uniquePromoted;
  }

  // Extract post information
  extractPostInfo(postElement) {
    let title = '';
    let url = '';
    let subreddit = '';

    // Try multiple methods to get title
    const titleElement = postElement.querySelector('[slot="title"]') ||
                        postElement.querySelector('h3') ||
                        postElement.querySelector('h2') ||
                        postElement.querySelector('[data-click-id="text"]') ||
                        postElement.querySelector('a[data-click-id="body"]') ||
                        postElement.querySelector('[id*="post-title"]');

    if (titleElement) {
      title = titleElement.textContent.trim();
    }

    // Try to get the post URL from multiple sources
    const linkElement = postElement.querySelector('a[slot="full-post-link"]') ||
                       postElement.querySelector('a[data-click-id="body"]') ||
                       postElement.querySelector('a[href*="/comments/"]') ||
                       postElement.querySelector('a.SQnoC3ObvgnGjWt90zD9Z');

    if (linkElement) {
      url = linkElement.href;
    } else if (postElement.tagName === 'SHREDDIT-POST') {
      // For shreddit-post, try to get permalink
      const permalink = postElement.getAttribute('permalink');
      if (permalink) {
        url = `https://www.reddit.com${permalink}`;
      }
    }

    // Try to get subreddit from multiple sources
    const subredditElement = postElement.querySelector('[data-click-id="subreddit"]') ||
                            postElement.querySelector('a[href*="/r/"]') ||
                            postElement.querySelector('[slot="subreddit"]');

    if (subredditElement) {
      subreddit = subredditElement.textContent.trim();
    } else if (postElement.tagName === 'SHREDDIT-POST') {
      const subredditName = postElement.getAttribute('subreddit-prefixed-name');
      if (subredditName) {
        subreddit = subredditName;
      }
    }

    // Clean up title if it's too long or includes "Promoted"
    if (title.includes('Promoted')) {
      title = title.replace(/Promoted\s*/g, '').trim();
    }

    return {
      title: title || 'Promoted Post',
      url: url || window.location.href,
      subreddit: subreddit || 'Sponsored',
      timestamp: Date.now()
    };
  }

  // Automatically remove promoted posts by replacing with placeholder
  highlightPromotedPosts(posts) {
    posts.forEach(post => {
      if (!post.classList.contains('promoted-removed')) {
        console.log('[RedditX] Removing promoted post:', post);

        // Store post info before removing
        const postInfo = this.extractPostInfo(post);
        this.promotedPosts.add(JSON.stringify(postInfo));

        // Create a placeholder div to replace the promoted post
        const placeholder = document.createElement('div');
        placeholder.className = 'promoted-removed-placeholder promoted-removed';
        placeholder.style.cssText = `
          padding: 20px;
          text-align: center;
          color: #818384;
          font-size: 14px;
          background: rgba(255, 69, 0, 0.05);
          border: 2px dashed #ff4500;
          border-radius: 8px;
          margin: 10px 0;
        `;
        // Create escaped title
        const titleDiv = document.createElement('div');
        titleDiv.style.cssText = 'font-size: 12px; color: #666; margin-top: 8px;';
        titleDiv.textContent = postInfo.title || 'Sponsored post';

        placeholder.innerHTML = '<div style="margin-bottom: 8px;">🎯 Promoted content removed</div>';
        placeholder.appendChild(titleDiv);

        // Replace the promoted post with the placeholder
        if (post.parentNode) {
          post.parentNode.replaceChild(placeholder, post);
          console.log('[RedditX] Replaced promoted post with placeholder');
        }
      }
    });

    // Update storage with current promoted posts
    if (posts.length > 0) {
      this.updateStorage();
    }
  }


  // Update Chrome storage with promoted posts
  updateStorage() {
    try {
      const postsArray = Array.from(this.promotedPosts).map(p => JSON.parse(p));
      chrome.storage.local.set({
        promotedPosts: postsArray,
        count: postsArray.length,
        lastUpdate: Date.now()
      });
    } catch (error) {
      // Extension context may be invalidated during reload - this is safe to ignore
      if (error.message.includes('Extension context invalidated')) {
        console.log('[RedditX] Extension reloaded, stopping old instance');
        // Stop the observer if it exists
        if (this.observer) {
          this.observer.disconnect();
        }
      } else {
        console.error('[RedditX] Error updating storage:', error);
      }
    }
  }


  // Start observing for dynamically loaded content
  startObserver() {
    this.observer = new MutationObserver((mutations) => {
      // Check if new posts were added
      const addedNodes = [];
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element nodes only
            addedNodes.push(node);
          }
        });
      });

      if (addedNodes.length > 0) {
        // Re-scan for promoted posts
        const promoted = this.detectPromotedPosts();
        this.highlightPromotedPosts(promoted);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize detector
  init() {
    // Debug on first run
    setTimeout(() => {
      this.debugPostStructure();
    }, 2000);

    // Initial detection
    setTimeout(() => {
      const promoted = this.detectPromotedPosts();
      this.highlightPromotedPosts(promoted);
    }, 1000);

    // Start observing for new content
    this.startObserver();

    // Periodic check to catch any missed posts
    setInterval(() => {
      const promoted = this.detectPromotedPosts();
      this.highlightPromotedPosts(promoted);
    }, 2000);
  }
}

// Store detector instance globally so we can access it from message listener
let detectorInstance = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    detectorInstance = new RedditPromotedDetector();
    detectorInstance.init();
  });
} else {
  detectorInstance = new RedditPromotedDetector();
  detectorInstance.init();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'getPromotedCount') {
      chrome.storage.local.get(['count'], (result) => {
        sendResponse({ count: result.count || 0 });
      });
      return true;
    }
  } catch (error) {
    console.error('[RedditX] Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
  return true;
});
