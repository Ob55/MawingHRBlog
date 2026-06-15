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
  const pendingPanel = $('pendingPanel');
  const pendingList = $('pendingList');
  const formHeading = $('formHeading');
  const formSubhead = $('formSubhead');

  let quill = null;
  let postsCache = [];   // full published posts (so Edit can prefill the form)
  let editingId = null;  // null = creating, otherwise editing this post id

  // -------- Dashboard flow: list ↔ form --------
  function showForm() {
    listPanel.hidden = true;
    if (pendingPanel) pendingPanel.hidden = true;
    formPanel.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showList() {
    formPanel.hidden = true;
    listPanel.hidden = false;
    resetForm();
    loadPending();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Open the form in "create" mode.
  function startCreate() {
    editingId = null;
    resetForm();
    if (formHeading) formHeading.innerHTML = 'Publish a new <span class="serif">article</span>';
    if (formSubhead) formSubhead.textContent = 'Fill in the details, format the body, attach a cover image, then publish.';
    publishBtn.querySelector('.label').textContent = 'Publish article';
    postImage.required = true;
    const lastAuthor = localStorage.getItem(AUTHOR_KEY);
    if (lastAuthor) postAuthor.value = lastAuthor;
    showForm();
  }

  newArticleBtn.addEventListener('click', startCreate);
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
    editingId = null;
    uploadForm.reset();
    if (quill) quill.setContents([]);
    imagePreview.hidden = true;
    imagePreviewImg.src = '';
    shortCount.textContent = '0';
    postImage.required = true;
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

  // -------- Create / edit submit --------
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');

    const isEdit = !!editingId;
    const title = postTitle.value.trim();
    const author = postAuthor.value.trim();
    const shortDescription = postShort.value.trim();
    const bodyHtml = quill ? quill.root.innerHTML.trim() : '';
    const bodyText = quill ? quill.getText().trim() : '';
    const file = postImage.files && postImage.files[0];

    // Image is required when creating, optional when editing (keeps the current one).
    if (!title || !author || !shortDescription || !bodyText || (!isEdit && !file)) {
      toast({ kind: 'error', title: 'Missing fields', message: isEdit ? 'Title, author, description and body are all required.' : 'All fields are required, including the cover image.' });
      return;
    }

    publishBtn.disabled = true;
    setStatus(isEdit ? 'Saving…' : 'Publishing…');

    try {
      const payload = { title, author, shortDescription, body: bodyHtml };
      if (file) {
        payload.imageBase64 = await fileToBase64(file);
        payload.imageName = file.name;
        payload.imageType = file.type;
      }

      let res;
      if (isEdit) {
        payload.id = editingId;
        res = await fetch('/api/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || (isEdit ? 'Save failed' : 'Upload failed'));
      }

      localStorage.setItem(AUTHOR_KEY, author);
      setStatus('');
      toast({
        kind: 'success',
        title: isEdit ? 'Changes saved' : 'Published',
        message: isEdit ? `"${title}" was updated.` : `"${title}" is now live on the blog.`
      });
      setTimeout(() => {
        showList();
        loadPosts();
      }, 600);
    } catch (err) {
      console.error(err);
      setStatus('');
      toast({ kind: 'error', title: isEdit ? 'Save failed' : 'Upload failed', message: err.message || 'Please try again.' });
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
    postsCache = posts || [];
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
          <div class="post-row-actions">
            <button type="button" class="btn btn-ghost" data-action="edit">Edit</button>
            <button type="button" class="btn btn-danger" data-action="delete">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    postList.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.post-row');
        deletePost(row.getAttribute('data-id'), row);
      });
    });
    postList.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.post-row');
        startEdit(row.getAttribute('data-id'));
      });
    });
  }

  // -------- Edit an existing post --------
  function startEdit(id) {
    const post = postsCache.find((p) => p.id === id);
    if (!post) {
      toast({ kind: 'error', title: 'Could not open editor', message: 'Post not found — try refreshing.' });
      return;
    }
    editingId = id;
    postTitle.value = post.title || '';
    postAuthor.value = post.author || '';
    postShort.value = post.shortDescription || '';
    shortCount.textContent = String(postShort.value.length);
    if (quill) quill.root.innerHTML = post.body || '';

    // Keep the current cover image unless a new one is chosen.
    postImage.required = false;
    if (post.image) {
      imagePreviewImg.src = post.image;
      imagePreview.hidden = false;
    } else {
      imagePreview.hidden = true;
    }

    if (formHeading) formHeading.innerHTML = 'Edit <span class="serif">article</span>';
    if (formSubhead) formSubhead.textContent = 'Update the details. Leave the image empty to keep the current cover.';
    publishBtn.querySelector('.label').textContent = 'Save changes';
    showForm();
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

  // -------- Pending approval (auto-generated drafts) --------
  async function loadPending() {
    if (!pendingPanel) return;
    try {
      const res = await fetch('/api/pending', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load drafts');
      const data = await res.json();
      renderPending(Array.isArray(data.pending) ? data.pending : []);
    } catch (err) {
      console.warn('Pending API unavailable.', err);
      renderPending([]);
    }
  }

  function renderPending(drafts) {
    if (!drafts.length) {
      pendingPanel.hidden = true;
      pendingList.innerHTML = '';
      return;
    }
    pendingPanel.hidden = false;
    pendingList.innerHTML = drafts.map((d) => {
      const dt = formatDateTime(d.draftedAt);
      const img = d.image ? `<img src="${escapeAttr(d.image)}" alt="">` : '';
      return `
        <div class="post-row pending" data-id="${escapeAttr(d.id)}">
          <div class="post-row-thumb">${img}</div>
          <div class="post-row-body">
            <p class="post-row-title">${escapeHtml(d.title || 'Untitled')} <span class="pending-badge">Draft</span></p>
            <p class="post-row-desc">${escapeHtml(d.shortDescription || '')}</p>
            <div class="post-row-meta">
              ${dt ? `<span>drafted ${escapeHtml(dt)}</span>` : ''}
              ${d.author ? `<span class="by">by ${escapeHtml(d.author)}</span>` : ''}
            </div>
          </div>
          <div class="post-row-actions">
            <button type="button" class="btn btn-primary" data-action="approve" data-url="${escapeAttr(d.approveUrl)}">Approve</button>
            <button type="button" class="btn btn-ghost" data-action="regenerate" data-url="${escapeAttr(d.regenerateUrl)}">Regenerate</button>
            <button type="button" class="btn btn-danger" data-action="reject" data-url="${escapeAttr(d.rejectUrl)}">Reject</button>
          </div>
        </div>
      `;
    }).join('');

    pendingList.querySelectorAll('[data-action="approve"]').forEach((btn) => {
      btn.addEventListener('click', () => approveDraft(btn));
    });
    pendingList.querySelectorAll('[data-action="reject"]').forEach((btn) => {
      btn.addEventListener('click', () => rejectDraft(btn));
    });
    pendingList.querySelectorAll('[data-action="regenerate"]').forEach((btn) => {
      btn.addEventListener('click', () => regenerateDraft(btn));
    });
  }

  async function approveDraft(btn) {
    const row = btn.closest('.post-row');
    const title = row.querySelector('.post-row-title')?.textContent?.replace('Draft', '').trim() || 'this draft';
    btn.disabled = true;
    try {
      const res = await fetch(btn.getAttribute('data-url'));
      if (!res.ok) throw new Error('Approve failed');
      toast({ kind: 'success', title: 'Published', message: `"${title}" is now live on the blog.` });
      loadPending();
      loadPosts();
    } catch (err) {
      btn.disabled = false;
      toast({ kind: 'error', title: 'Approve failed', message: 'Could not publish the draft. Please try again.' });
    }
  }

  async function rejectDraft(btn) {
    const row = btn.closest('.post-row');
    const title = row.querySelector('.post-row-title')?.textContent?.replace('Draft', '').trim() || 'this draft';
    const ok = await openConfirm({
      title: 'Reject this draft?',
      body: `"${title}" will be discarded along with its image and will not be published.`,
      okLabel: 'Reject'
    });
    if (!ok) return;
    try {
      const res = await fetch(btn.getAttribute('data-url'));
      if (!res.ok) throw new Error('Reject failed');
      row.remove();
      if (!pendingList.querySelector('.post-row')) pendingPanel.hidden = true;
      toast({ kind: 'success', title: 'Draft rejected', message: `"${title}" was discarded.` });
    } catch (err) {
      toast({ kind: 'error', title: 'Reject failed', message: 'Could not reject the draft. Please try again.' });
    }
  }

  async function regenerateDraft(btn) {
    const row = btn.closest('.post-row');
    const title = row.querySelector('.post-row-title')?.textContent?.replace('Draft', '').trim() || 'this draft';
    const ok = await openConfirm({
      title: 'Regenerate this draft?',
      body: `"${title}" will be discarded and a different article will be generated and emailed for approval. The new one usually arrives within a minute or two.`,
      okLabel: 'Regenerate'
    });
    if (!ok) return;
    btn.disabled = true;
    try {
      const res = await fetch(btn.getAttribute('data-url'));
      if (!res.ok) throw new Error('Regenerate failed');
      row.remove();
      if (!pendingList.querySelector('.post-row')) pendingPanel.hidden = true;
      toast({ kind: 'success', title: 'Generating a new article', message: 'A different article is being prepared and will be emailed for approval shortly.' });
      setTimeout(loadPending, 90000); // refresh after the new draft has likely arrived
    } catch (err) {
      btn.disabled = false;
      toast({ kind: 'error', title: 'Regenerate failed', message: 'Could not start a new draft. Please try again.' });
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
  loadPending();
})();
