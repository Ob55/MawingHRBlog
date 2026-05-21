(function () {
  'use strict';

  const AUTHOR_KEY = 'mawingu_admin_last_author';
  const $ = (id) => document.getElementById(id);

  const listPanel = $('listPanel');
  const formPanel = $('formPanel');
  const newArticleBtn = $('newArticleBtn');
  const cancelFormBtn = $('cancelFormBtn');

  const uploadForm = $('uploadForm');
  const postTitle = $('postTitle');
  const postAuthor = $('postAuthor');
  const postShort = $('postShort');
  const postImage = $('postImage');
  const imagePreview = $('imagePreview');
  const imagePreviewImg = $('imagePreviewImg');
  const imageClear = $('imageClear');
  const shortCount = $('shortCount');
  const publishBtn = $('publishBtn');
  const uploadStatus = $('uploadStatus');
  const postList = $('postList');

  let quill = null;

  // -------- Dashboard flow: list ↔ form --------
  function showForm() {
    listPanel.hidden = true;
    formPanel.hidden = false;
    const lastAuthor = localStorage.getItem(AUTHOR_KEY);
    if (lastAuthor && !postAuthor.value) postAuthor.value = lastAuthor;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showList() {
    formPanel.hidden = true;
    listPanel.hidden = false;
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  newArticleBtn.addEventListener('click', showForm);
  cancelFormBtn.addEventListener('click', showList);

  // -------- Quill rich text editor --------
  function initEditor() {
    if (quill) return;
    quill = new Quill('#editor', {
      modules: { toolbar: '#editorToolbar' },
      placeholder: 'Write the full article here. Use the toolbar above to format text, add headings, alignment, lists, and links.',
      theme: 'snow'
    });
  }

  // -------- Form helpers --------
  postShort.addEventListener('input', () => {
    shortCount.textContent = String(postShort.value.length);
  });

  postImage.addEventListener('change', () => {
    const file = postImage.files && postImage.files[0];
    if (!file) {
      imagePreview.hidden = true;
      imagePreviewImg.src = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus('Image is too large. Max 5MB.', 'error');
      postImage.value = '';
      imagePreview.hidden = true;
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreviewImg.src = e.target.result;
      imagePreview.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  imageClear.addEventListener('click', () => {
    postImage.value = '';
    imagePreview.hidden = true;
    imagePreviewImg.src = '';
  });

  function setStatus(text, kind) {
    uploadStatus.textContent = text;
    uploadStatus.className = 'upload-status' + (kind ? ' ' + kind : '');
  }

  function resetForm() {
    uploadForm.reset();
    if (quill) quill.setContents([]);
    imagePreview.hidden = true;
    imagePreviewImg.src = '';
    shortCount.textContent = '0';
    setStatus('');
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // -------- Upload --------
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');

    const title = postTitle.value.trim();
    const author = postAuthor.value.trim();
    const shortDescription = postShort.value.trim();
    const bodyHtml = quill ? quill.root.innerHTML.trim() : '';
    const bodyText = quill ? quill.getText().trim() : '';
    const file = postImage.files && postImage.files[0];

    if (!title || !author || !shortDescription || !bodyText || !file) {
      setStatus('All fields are required.', 'error');
      return;
    }

    publishBtn.disabled = true;
    setStatus('Publishing…');

    try {
      const imageBase64 = await fileToBase64(file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          shortDescription,
          body: bodyHtml,
          imageName: file.name,
          imageType: file.type,
          imageBase64
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || 'Upload failed');
      }

      localStorage.setItem(AUTHOR_KEY, author);
      setStatus('Published successfully.', 'success');
      setTimeout(() => {
        showList();
        loadPosts();
      }, 700);
    } catch (err) {
      console.error(err);
      setStatus('Upload failed. ' + (err.message || ''), 'error');
    } finally {
      publishBtn.disabled = false;
    }
  });

  // -------- Posts list --------
  async function loadPosts() {
    postList.innerHTML = '<div class="post-list-loading">Loading articles…</div>';
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      renderPosts(Array.isArray(data) ? data : (data.posts || []));
    } catch (err) {
      console.warn('Posts API unavailable.', err);
      renderPosts([]);
    }
  }

  function formatDateTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function renderPosts(posts) {
    if (!posts.length) {
      postList.innerHTML = '<div class="post-list-empty">No articles published yet. Click <strong>New article</strong> to publish the first one.</div>';
      return;
    }
    postList.innerHTML = posts.map((p) => {
      const dt = formatDateTime(p.publishedAt);
      const img = p.image ? `<img src="${escapeAttr(p.image)}" alt="">` : '';
      return `
        <div class="post-row" data-id="${escapeAttr(p.id)}">
          <div class="post-row-thumb">${img}</div>
          <div class="post-row-body">
            <p class="post-row-title">${escapeHtml(p.title || 'Untitled')}</p>
            <div class="post-row-meta">
              ${dt ? `<span>${escapeHtml(dt)}</span>` : ''}
              ${p.author ? `<span class="by">by ${escapeHtml(p.author)}</span>` : ''}
            </div>
          </div>
          <button type="button" class="btn btn-danger" data-action="delete">Delete</button>
        </div>
      `;
    }).join('');

    postList.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.post-row');
        const id = row.getAttribute('data-id');
        deletePost(id, row);
      });
    });
  }

  async function deletePost(id, row) {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Delete failed');
      row.remove();
      if (!postList.querySelector('.post-row')) {
        postList.innerHTML = '<div class="post-list-empty">No articles published yet. Click <strong>New article</strong> to publish the first one.</div>';
      }
    } catch (err) {
      alert('Could not delete article. Please try again.');
    }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function escapeAttr(str) { return escapeHtml(str); }

  // Initialise on load.
  initEditor();
  loadPosts();
})();
