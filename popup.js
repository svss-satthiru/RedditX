// Popup script for RedditX

// ===== Tab Management =====
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');

      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));

      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
}

// ===== Settings Management =====
const STYLE_PREVIEWS = {
  minimal: `
    <div style="padding: 8px 12px; text-align: left; color: #999; font-size: 11px; background: #f5f5f5; border-left: 3px solid #ff4500; margin: 5px 0;">
      🚫 Ad removed
    </div>
  `,
  card: `
    <div style="padding: 20px; background: white; border-radius: 12px; border: 1px solid #e0e0e0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 16px 0;">
      <div style="font-weight: 600; color: #333; margin-bottom: 8px;">🎯 Promoted Post Removed</div>
      <div style="font-size: 12px; color: #666;">"Example post title"</div>
    </div>
  `,
  success: `
    <div style="padding: 16px; background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%); border-left: 4px solid #48bb78; border-radius: 4px; color: #2f855a; font-size: 13px; margin: 10px 0;">
      ✅ Advertisement blocked<br>
      <div style="font-size: 11px; margin-top: 4px;">RedditX is protecting you</div>
    </div>
  `,
  ghost: `
    <div style="padding: 12px; text-align: center; color: #ccc; font-size: 11px; background: transparent; border: 1px dashed #ddd; border-radius: 4px; margin: 8px 0; opacity: 0.6;">
      [Sponsored content hidden]
    </div>
  `,
  stats: `
    <div style="padding: 12px 16px; background: #1a1a1b; color: #ff4500; font-weight: 600; font-size: 12px; border-radius: 6px; text-align: left; margin: 10px 0;">
      🛡️ AD BLOCKED (#3)<br>
      <div style="font-size: 10px; color: #818384; margin-top: 4px;">by RedditX</div>
    </div>
  `,
  line: `
    <div style="padding: 8px; text-align: center; color: #999; font-size: 11px; background: transparent; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; margin: 10px 0;">
      ───── 🎯 Promoted content removed ─────
    </div>
  `,
  none: `
    <div style="padding: 20px; text-align: center; color: #666; font-size: 12px; font-style: italic;">
      No visual placeholder<br>
      <div style="font-size: 10px; margin-top: 8px;">(Post removed completely)</div>
    </div>
  `
};

function initSettings() {
  const dropdownSelected = document.getElementById('dropdownSelected');
  const dropdownOptions = document.getElementById('dropdownOptions');
  const previewBox = document.getElementById('stylePreview');
  const allOptions = document.querySelectorAll('.dropdown-option');

  // Style name mapping for display
  const styleNames = {
    'stats': '🛡️ Stats Counter (Default)',
    'minimal': '🚫 Minimal/Compact',
    'card': '🎯 Card with Shadow',
    'success': '✅ Success/Checkmark',
    'ghost': '👻 Ghost/Transparent',
    'line': '─ Single Line Banner',
    'none': '∅ No Visual Indicator'
  };

  // Load saved setting or use default
  chrome.storage.local.get(['placeholderStyle'], (result) => {
    const savedStyle = result.placeholderStyle || 'stats';
    updateSelectedStyle(savedStyle);
    updatePreview(savedStyle);
  });

  // Toggle dropdown on click
  dropdownSelected.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = dropdownSelected.classList.contains('active');

    if (isActive) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // Handle option selection
  allOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const style = option.getAttribute('data-style');

      // Update UI
      updateSelectedStyle(style);
      updatePreview(style);
      closeDropdown();

      // Save setting immediately
      chrome.storage.local.set({ placeholderStyle: style }, () => {
        console.log(`[RedditX] Saved placeholder style: ${style}`);

        // Notify content script to update style
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].url && tabs[0].url.includes('reddit.com')) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'updatePlaceholderStyle',
              style: style
            });
          }
        });
      });
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdownSelected.contains(e.target) && !dropdownOptions.contains(e.target)) {
      closeDropdown();
    }
  });

  function updateSelectedStyle(style) {
    // Update selected text
    const selectedText = dropdownSelected.querySelector('.dropdown-text');
    selectedText.textContent = styleNames[style] || styleNames.stats;

    // Update checkmarks
    allOptions.forEach(opt => {
      if (opt.getAttribute('data-style') === style) {
        opt.classList.add('selected');
      } else {
        opt.classList.remove('selected');
      }
    });
  }

  function openDropdown() {
    dropdownSelected.classList.add('active');
    dropdownOptions.classList.add('show');
  }

  function closeDropdown() {
    dropdownSelected.classList.remove('active');
    dropdownOptions.classList.remove('show');
  }

  function updatePreview(style) {
    previewBox.innerHTML = STYLE_PREVIEWS[style] || STYLE_PREVIEWS.stats;
  }
}

// ===== Stats Tab Functions =====
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

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSettings();
  loadPosts();
});

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
