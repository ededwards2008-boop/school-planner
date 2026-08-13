// Simple School Planner - data stored in localStorage

const STORAGE_KEY = 'school-planner-data';

let data = {
  classes: [],
  homework: [],
  subjects: []
};

// Load data
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    data = JSON.parse(saved);
  }
}

// Save data
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Generate unique ID
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Modal elements
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalForm = document.getElementById('modal-form');
const cancelBtn = document.getElementById('cancel-btn');

let currentType = null; // 'class' | 'homework' | 'subject'
let editingId = null;

function openModal(type, item = null) {
  currentType = type;
  editingId = item ? item.id : null;

  // Show/hide fields based on type
  document.getElementById('day-group').style.display = type === 'class' ? 'block' : 'none';
  document.getElementById('time-group').style.display = type === 'class' ? 'block' : 'none';
  document.getElementById('due-group').style.display = type === 'homework' ? 'block' : 'none';
  document.getElementById('subject-group').style.display = type !== 'subject' ? 'block' : 'none';

  modalTitle.textContent = item ? `Edit ${type}` : `Add ${type}`;

  // Fill form
  document.getElementById('item-title').value = item ? item.title : '';
  document.getElementById('item-day').value = item ? (item.day || 'Monday') : 'Monday';
  document.getElementById('item-time').value = item ? (item.time || '') : '';
  document.getElementById('item-due').value = item ? (item.due || '') : '';
  document.getElementById('item-subject').value = item ? (item.subject || '') : '';
  document.getElementById('item-notes').value = item ? (item.notes || '') : '';

  modal.classList.remove('hidden');
  document.getElementById('item-title').focus();
}

function closeModal() {
  modal.classList.add('hidden');
  modalForm.reset();
  currentType = null;
  editingId = null;
}

cancelBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Form submit
modalForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = document.getElementById('item-title').value.trim();
  if (!title) return;

  const item = {
    id: editingId || uid(),
    title,
    notes: document.getElementById('item-notes').value.trim()
  };

  if (currentType === 'class') {
    item.day = document.getElementById('item-day').value;
    item.time = document.getElementById('item-time').value.trim();
    item.subject = document.getElementById('item-subject').value.trim();
  } else if (currentType === 'homework') {
    item.due = document.getElementById('item-due').value;
    item.subject = document.getElementById('item-subject').value.trim();
  }

  const listKey = currentType === 'class' ? 'classes' : currentType === 'homework' ? 'homework' : 'subjects';

  if (editingId) {
    const index = data[listKey].findIndex(i => i.id === editingId);
    if (index !== -1) data[listKey][index] = item;
  } else {
    data[listKey].push(item);
  }

  saveData();
  render();
  closeModal();
});

// Delete item
function deleteItem(type, id) {
  if (!confirm('Delete this item?')) return;
  const listKey = type === 'class' ? 'classes' : type === 'homework' ? 'homework' : 'subjects';
  data[listKey] = data[listKey].filter(i => i.id !== id);
  saveData();
  render();
}

// Render functions
function renderSchedule() {
  const container = document.getElementById('schedule-list');
  if (data.classes.length === 0) {
    container.innerHTML = `<div class="empty-state">No classes yet.<br>Click "+ Add Class" to start.</div>`;
    return;
  }

  // Sort by day order
  const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const sorted = [...data.classes].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

  container.innerHTML = sorted.map(item => `
    <div class="card">
      <div class="card-content">
        <div class="card-title">${escapeHtml(item.title)}</div>
        <div class="card-meta">${item.day}${item.time ? ' · ' + escapeHtml(item.time) : ''}${item.subject ? ' · ' + escapeHtml(item.subject) : ''}</div>
        ${item.notes ? `<div class="card-notes">${escapeHtml(item.notes)}</div>` : ''}
      </div>
      <div class="card-actions">
        <button class="btn secondary" onclick='openModal("class", ${JSON.stringify(item).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="btn danger" onclick="deleteItem('class', '${item.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderHomework() {
  const container = document.getElementById('homework-list');
  if (data.homework.length === 0) {
    container.innerHTML = `<div class="empty-state">No homework yet.<br>Click "+ Add Homework" to add a task.</div>`;
    return;
  }

  // Sort by due date
  const sorted = [...data.homework].sort((a, b) => {
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due.localeCompare(b.due);
  });

  container.innerHTML = sorted.map(item => `
    <div class="card">
      <div class="card-content">
        <div class="card-title">${escapeHtml(item.title)}</div>
        <div class="card-meta">
          ${item.due ? 'Due: ' + formatDate(item.due) : 'No due date'}
          ${item.subject ? ' · ' + escapeHtml(item.subject) : ''}
        </div>
        ${item.notes ? `<div class="card-notes">${escapeHtml(item.notes)}</div>` : ''}
      </div>
      <div class="card-actions">
        <button class="btn secondary" onclick='openModal("homework", ${JSON.stringify(item).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="btn danger" onclick="deleteItem('homework', '${item.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderSubjects() {
  const container = document.getElementById('subjects-list');
  if (data.subjects.length === 0) {
    container.innerHTML = `<div class="empty-state">No subjects yet.<br>Click "+ Add Subject" to add one.</div>`;
    return;
  }

  container.innerHTML = data.subjects.map(item => `
    <div class="card">
      <div class="card-content">
        <div class="card-title">${escapeHtml(item.title)}</div>
        ${item.notes ? `<div class="card-notes">${escapeHtml(item.notes)}</div>` : ''}
      </div>
      <div class="card-actions">
        <button class="btn secondary" onclick='openModal("subject", ${JSON.stringify(item).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="btn danger" onclick="deleteItem('subject', '${item.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function render() {
  renderSchedule();
  renderHomework();
  renderSubjects();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

// Button listeners
document.getElementById('add-class-btn').addEventListener('click', () => openModal('class'));
document.getElementById('add-homework-btn').addEventListener('click', () => openModal('homework'));
document.getElementById('add-subject-btn').addEventListener('click', () => openModal('subject'));

// Init
loadData();
render();