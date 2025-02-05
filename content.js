let draggingNote = null;
let initialMouseX = 0;
let initialMouseY = 0;

// Load saved notes when page loads
chrome.storage.local.get(['notes'], (result) => {
  const notes = result.notes || [];
  notes.forEach(createStickyNote);
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'createNote') {
    createStickyNote(request.note);
  }
});

function createStickyNote(noteData) {
  const note = document.createElement('div');
  note.className = 'sticky-note';
  note.id = `note-${noteData.id}`;
  note.style.backgroundColor = noteData.color;
  note.style.left = `${noteData.position.x}px`;
  note.style.top = `${noteData.position.y}px`;

  note.innerHTML = `
    <div class="sticky-note-header">
      <div class="sticky-note-controls">
        <span class="sticky-note-control" data-action="minimize">−</span>
        <span class="sticky-note-control" data-action="delete">×</span>
      </div>
    </div>
    <div class="sticky-note-content" contenteditable="true" style="font-size: ${noteData.fontSize}">${noteData.content}</div>
    <div class="sticky-note-footer">
      ${new Date(noteData.timestamp).toLocaleString()}
    </div>
    ${noteData.reminder ? '<div class="reminder-badge"></div>' : ''}
  `;

  // Make note draggable
  note.querySelector('.sticky-note-header').addEventListener('mousedown', (e) => {
    draggingNote = note;
    initialMouseX = e.clientX - note.offsetLeft;
    initialMouseY = e.clientY - note.offsetTop;
  });

  // Save content changes
  const content = note.querySelector('.sticky-note-content');
  content.addEventListener('input', () => {
    chrome.storage.local.get(['notes'], (result) => {
      const notes = result.notes || [];
      const noteIndex = notes.findIndex(n => n.id === noteData.id);
      if (noteIndex !== -1) {
        notes[noteIndex].content = content.innerHTML;
        chrome.storage.local.set({ notes });
      }
    });
  });

  // Handle controls
  note.querySelector('.sticky-note-controls').addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (action === 'delete') {
      deleteNote(noteData.id, note);
    } else if (action === 'minimize') {
      note.classList.toggle('minimized');
    }
  });

  document.body.appendChild(note);
}

// Handle dragging
document.addEventListener('mousemove', (e) => {
  if (draggingNote) {
    const newX = e.clientX - initialMouseX;
    const newY = e.clientY - initialMouseY;
    draggingNote.style.left = `${newX}px`;
    draggingNote.style.top = `${newY}px`;

    // Save position
    const noteId = parseInt(draggingNote.id.split('-')[1]);
    chrome.storage.local.get(['notes'], (result) => {
      const notes = result.notes || [];
      const noteIndex = notes.findIndex(n => n.id === noteId);
      if (noteIndex !== -1) {
        notes[noteIndex].position = { x: newX, y: newY };
        chrome.storage.local.set({ notes });
      }
    });
  }
});

document.addEventListener('mouseup', () => {
  draggingNote = null;
});

function deleteNote(noteId, noteElement) {
  chrome.storage.local.get(['notes'], (result) => {
    const notes = result.notes.filter(n => n.id !== noteId);
    chrome.storage.local.set({ notes }, () => {
      noteElement.remove();
    });
  });
}