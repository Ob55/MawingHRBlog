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

  // -------- Toasts --------
  const toastContainer = document.getElementById('toastContainer');

  function toast({ title, message, kind, duration }) {
    if (!toastContainer) return;
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    const iconChar = kind === 'success' ? '✓' : kind === 'error' ? '!' : 'i';
    el.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${iconChar}</span>
      <div class="toast-body">
        ${title ? `<p class="toast-title">${escapeHtml(title)}</p>` : ''}
        ${message ? `<p class="toast-msg">${escapeHtml(message)}</p>` : ''}
      </div>
      <button type="button" class="toast-close" aria-label="Dismiss">×</button>
    `;
    toastContainer.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));

    const remove = () => {
      el.classList.remove('in');
      el.classList.add('out');
      setTimeout(() => el.remove(), 300);
    };
    el.querySelector('.toast-close').addEventListener('click', remove);
    const ms = typeof duration === 'number' ? duration : (kind === 'error' ? 6000 : 4000);
    setTimeout(remove, ms);
  }

  // -------- Confirm modal --------
  const confirmModal = document.getElementById('confirmModal');
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmBody  = document.getElementById('confirmBody');
  const confirmOkBtn = document.getElementById('confirmOkBtn');
  let confirmResolver = null;

  function openConfirm({ title, body, okLabel }) {
    return new Promise((resolve) => {
      confirmResolver = resolve;
      if (title) confirmTitle.textContent = title;
      if (body)  confirmBody.textContent = body;
      if (okLabel) confirmOkBtn.textContent = okLabel;
      confirmModal.hidden = false;
      confirmModal.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => confirmModal.classList.add('open'));
      document.body.style.overflow = 'hidden';
      confirmOkBtn.focus();
    });
  }

  function closeConfirm(result) {
    confirmModal.classList.remove('open');
    confirmModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      confirmModal.hidden = true;
      if (confirmResolver) {
        confirmResolver(result);
        confirmResolver = null;
      }
    }, 220);
  }

  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-confirm-close')) closeConfirm(false);
    });
    confirmOkBtn.addEventListener('click', () => closeConfirm(true));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !confirmModal.hidden) closeConfirm(false);
    });
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
      toast({ kind: 'error', title: 'Missing fields', message: 'All fields are required, including the cover image.' });
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
      setStatus('');
      toast({ kind: 'success', title: 'Published', message: `"${title}" is now live on the blog.` });
      setTimeout(() => {
        showList();
        loadPosts();
      }, 600);
    } catch (err) {
      console.error(err);
      setStatus('');
      toast({ kind: 'error', title: 'Upload failed', message: err.message || 'Please try again.' });
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
    const title = row.querySelector('.post-row-title')?.textContent || 'this article';
    const ok = await openConfirm({
      title: 'Delete this article?',
      body: `"${title}" will be permanently removed from the blog along with its image. This cannot be undone.`,
      okLabel: 'Delete'
    });
    if (!ok) return;

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
      toast({ kind: 'success', title: 'Article deleted', message: `"${title}" was removed.` });
    } catch (err) {
      toast({ kind: 'error', title: 'Delete failed', message: 'Could not delete the article. Please try again.' });
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
