<script>
  let username = '';
  let posts    = [];
  let nextId   = 1;

 
  function initials(name) {
    return name.slice(0,2).toUpperCase();
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60)   return 'just now';
    if (s < 3600) return Math.floor(s/60) + 'm ago';
    if (s < 86400) return Math.floor(s/3600) + 'h ago';
    return Math.floor(s/86400) + 'd ago';
  }

  function updateStats() {
    document.getElementById('stat-posts').textContent = posts.length;
    const totalLikes = posts.reduce((a,p) => a + p.likes, 0);
    document.getElementById('stat-likes').textContent = totalLikes;
  }


  document.getElementById('username-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') createProfile();
  });

  function createProfile() {
    const raw = document.getElementById('username-input').value.trim();
    const err = document.getElementById('setup-err');

    if (!raw) { err.textContent = 'Please enter a username.'; return; }
    if (raw.length < 3) { err.textContent = 'Username must be at least 3 characters.'; return; }
    if (!/^[a-zA-Z0-9_.]+$/.test(raw)) { err.textContent = 'Letters, numbers, _ and . only.'; return; }

    err.textContent = '';
    username = raw;

  
    const ini = initials(username);
    document.getElementById('profile-avatar').textContent   = ini;
    document.getElementById('topbar-avatar').textContent    = ini;
    document.getElementById('composer-avatar').textContent  = ini;
    document.getElementById('profile-name').textContent     = username;
    document.getElementById('profile-handle').textContent   = '@' + username.toLowerCase();
    document.getElementById('topbar-name').textContent      = username;

    document.getElementById('setup-screen').style.display   = 'none';
    document.getElementById('profile-screen').style.display = 'block';
  }

  /* ── Composer ── */
  const postInput = document.getElementById('post-input');
  const charCount = document.getElementById('char-count');
  const postBtn   = document.getElementById('post-btn');

  postInput.addEventListener('input', () => {
    const left = 280 - postInput.value.length;
    charCount.textContent = left + ' left';
    charCount.classList.toggle('warn', left < 30);
    postBtn.disabled = postInput.value.trim().length === 0;
  });

  function submitPost() {
    const text = postInput.value.trim();
    if (!text) return;

    const post = { id: nextId++, text, ts: Date.now(), likes: 0, liked: false };
    posts.unshift(post);

    postInput.value = '';
    charCount.textContent = '280 left';
    charCount.classList.remove('warn');
    postBtn.disabled = true;

    renderFeed();
    updateStats();
  }

  
  function renderFeed() {
    const feed = document.getElementById('feed');
    const empty = document.getElementById('empty-state');

    if (posts.length === 0) {
      empty.style.display = 'block';
 
      feed.querySelectorAll('.post-card').forEach(el => el.remove());
      return;
    }

    empty.style.display = 'none';

    feed.querySelectorAll('.post-card').forEach(el => el.remove());

    posts.forEach(post => {
      const card = buildPostCard(post);
      feed.appendChild(card);
    });

    updateStats();
  }

  function buildPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.dataset.id = post.id;

    card.innerHTML = `
      <div class="post-header">
        <div class="post-avatar">${initials(username)}</div>
        <div class="post-meta">
          <div class="post-username">${username}</div>
          <div class="post-time" data-ts="${post.ts}">${timeAgo(post.ts)}</div>
        </div>
        <div class="post-menu">
          <button class="menu-btn" onclick="toggleMenu(${post.id})">⋯</button>
          <div class="dropdown" id="menu-${post.id}">
            <div class="drop-item" onclick="editPost(${post.id})">✏️ Edit</div>
            <div class="drop-item danger" onclick="deletePost(${post.id})">🗑 Delete</div>
          </div>
        </div>
      </div>
      <div class="post-body" id="body-${post.id}">${escHtml(post.text)}</div>
      <div class="post-footer">
        <button class="like-btn ${post.liked ? 'liked' : ''}" id="like-${post.id}" onclick="toggleLike(${post.id})">
          <span class="heart">${post.liked ? '❤️' : '🤍'}</span>
          <span>${post.likes} ${post.likes === 1 ? 'Like' : 'Likes'}</span>
        </button>
      </div>
    `;

    return card;
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }


  function toggleMenu(id) {
    const menu = document.getElementById('menu-' + id);
    const isOpen = menu.classList.contains('open');
    // close all
    document.querySelectorAll('.dropdown.open').forEach(m => m.classList.remove('open'));
    if (!isOpen) menu.classList.add('open');
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('.post-menu')) {
      document.querySelectorAll('.dropdown.open').forEach(m => m.classList.remove('open'));
    }
  });

  
  function deletePost(id) {
    posts = posts.filter(p => p.id !== id);
    renderFeed();
  }

  /* ── Edit ── */
  function editPost(id) {
    document.querySelectorAll('.dropdown.open').forEach(m => m.classList.remove('open'));

    const post = posts.find(p => p.id === id);
    if (!post) return;

    const bodyEl = document.getElementById('body-' + id);

    bodyEl.innerHTML = `
      <textarea class="edit-area" id="edit-${id}">${escHtml(post.text)}</textarea>
      <div class="edit-actions">
        <button class="btn-save" onclick="saveEdit(${id})">Save</button>
        <button class="btn-cancel" onclick="cancelEdit(${id})">Cancel</button>
      </div>
    `;

    const ta = document.getElementById('edit-' + id);
    ta.focus();
    ta.selectionStart = ta.selectionEnd = ta.value.length;
  }

  function saveEdit(id) {
    const ta = document.getElementById('edit-' + id);
    const newText = ta.value.trim();
    if (!newText) return;

    const post = posts.find(p => p.id === id);
    post.text = newText;
    renderFeed();
  }

  function cancelEdit(id) {
    const post = posts.find(p => p.id === id);
    document.getElementById('body-' + id).innerHTML = escHtml(post.text);
  }

  /* ── Like ── */
  function toggleLike(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;

    const btn = document.getElementById('like-' + id);
    btn.classList.toggle('liked', post.liked);
    btn.innerHTML = `
      <span class="heart">${post.liked ? '❤️' : '🤍'}</span>
      <span>${post.likes} ${post.likes === 1 ? 'Like' : 'Likes'}</span>
    `;
  
    btn.classList.remove('liked');
    void btn.offsetWidth;
    if (post.liked) btn.classList.add('liked');

    updateStats();
  }

  
  function logout() {
    username = '';
    posts    = [];
    nextId   = 1;
    document.getElementById('username-input').value = '';
    document.getElementById('setup-screen').style.display   = 'flex';
    document.getElementById('profile-screen').style.display = 'none';
    document.getElementById('feed').querySelectorAll('.post-card').forEach(el => el.remove());
    document.getElementById('empty-state').style.display = 'block';
    updateStats();
  }

  /* ── Live timestamp refresh ── */
  setInterval(() => {
    document.querySelectorAll('.post-time[data-ts]').forEach(el => {
      el.textContent = timeAgo(+el.dataset.ts);
    });
  }, 30000);
</script>