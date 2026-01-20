// Popup script for RedditX

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function displayPosts(posts) {
  const postsList = document.getElementById('postsList');
  const promotedCount = document.getElementById('promotedCount');
  const lastUpdate = document.getElementById('lastUpdate');

  // Update count
  promotedCount.textContent = posts.length;

  // Update last update time
  if (posts.length > 0) {
    lastUpdate.textContent = formatTimeAgo(posts[0].timestamp);
  } else {
    lastUpdate.textContent = '-';
  }

  // Clear loading state
  postsList.innerHTML = '';

  if (posts.length === 0) {
    postsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✨</div>
        <div>No promoted posts detected</div>
        <div style="margin-top: 10px; font-size: 12px;">
          Promoted content is automatically removed
        </div>
      </div>
    `;
    return;
  }

  // Display posts
  posts.forEach(post => {
    const postItem = document.createElement('div');
    postItem.className = 'post-item';
    postItem.innerHTML = `
      <div class="post-title">${escapeHtml(post.title)}</div>
      <div class="post-meta">
        <span class="post-subreddit">${escapeHtml(post.subreddit)}</span>
        <span>•</span>
        <span>${formatTimeAgo(post.timestamp)}</span>
      </div>
    `;

    // Make post clickable
    if (post.url) {
      postItem.style.cursor = 'pointer';
      postItem.addEventListener('click', () => {
        chrome.tabs.create({ url: post.url });
      });
    }

    postsList.appendChild(postItem);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function loadPosts() {
  chrome.storage.local.get(['promotedPosts'], (result) => {
    const posts = result.promotedPosts || [];
    displayPosts(posts);
  });
}

// Load posts on popup open
loadPosts();

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
  // Query current tab and send message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url && tabs[0].url.includes('reddit.com')) {
      chrome.tabs.reload(tabs[0].id, {}, () => {
        setTimeout(loadPosts, 1000);
      });
    } else {
      loadPosts();
    }
  });
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.promotedPosts) {
    loadPosts();
  }
});
