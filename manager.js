document.addEventListener('DOMContentLoaded', () => {
  const noteList = document.getElementById('noteList');

  function loadNotes() {
    chrome.storage.local.get(['notes'], (result) => {
      const notes = result.notes || [];
      noteList.innerHTML = '';
      
      notes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.style.backgroundColor = note.color;
        
        noteCard.innerHTML = `
          <div class="note-content">${note.content || 'Empty note'}</div>
          <div class="note-info">
            Created: ${new Date(note.timestamp).toLocaleString()}
          </div>
          <div class="note-actions">
            <button onclick="deleteNote(${note.id})">Delete</button>
            <button onclick="editNote(${note.id})">Edit</button>
          </div>
        `;
        
        noteList.appendChild(noteCard);
      });
    });
  }

  window.deleteNote = (noteId) => {
    chrome.storage.local.get(['notes'], (result) => {
      const notes = result.notes.filter(n => n.id !== noteId);
      chrome.storage.local.set({ notes }, loadNotes);
    });
  };

  // Add modal HTML to manager.html
const modalHTML = `
  <div id="editModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Edit Note</h2>
        <span class="close-modal">&times;</span>
      </div>
      <div class="modal-body">
        <div class="edit-controls">
          <div class="color-picker">
            <h4>Color</h4>
            <div class="color-options">
              <div class="color-option" data-color="#fff9c4" style="background: #fff9c4"></div>
              <div class="color-option" data-color="#b3e5fc" style="background: #b3e5fc"></div>
              <div class="color-option" data-color="#f8bbd0" style="background: #f8bbd0"></div>
              <div class="color-option" data-color="#c8e6c9" style="background: #c8e6c9"></div>
            </div>
          </div>
          <div class="font-control">
            <h4>Font Size</h4>
            <select id="editFontSize">
              <option value="12px">Small</option>
              <option value="14px">Medium</option>
              <option value="16px">Large</option>
            </select>
          </div>
        </div>
        <div class="edit-content">
          <h4>Content</h4>
          <div id="editContent" contenteditable="true" class="edit-area"></div>
        </div>
        <div class="reminder-control">
          <h4>Reminder</h4>
          <input type="datetime-local" id="editReminder">
        </div>
      </div>
      <div class="modal-footer">
        <button id="saveNote" class="primary-btn">Save Changes</button>
        <button id="cancelEdit" class="secondary-btn">Cancel</button>
      </div>
    </div>
  </div>
`;

// Add styles to manager.html
const modalStyles = `
  .modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    z-index: 1000;
  }

  .modal-content {
    position: relative;
    background-color: #fff;
    margin: 50px auto;
    padding: 20px;
    width: 80%;
    max-width: 600px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .close-modal {
    font-size: 24px;
    cursor: pointer;
  }

  .edit-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }

  .color-options {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }

  .color-option {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid transparent;
  }

  .color-option.selected {
    border-color: #333;
  }

  .edit-area {
    min-height: 150px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
    margin-top: 10px;
    outline: none;
  }

  .modal-footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .primary-btn {
    background-color: #4CAF50;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .secondary-btn {
    background-color: #9e9e9e;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
`;

// Add modal HTML and styles to the document
document.head.insertAdjacentHTML('beforeend', `<style>${modalStyles}</style>`);
document.body.insertAdjacentHTML('beforeend', modalHTML);

// Edit note implementation
window.editNote = (noteId) => {
  const modal = document.getElementById('editModal');
  const closeBtn = document.querySelector('.close-modal');
  const saveBtn = document.getElementById('saveNote');
  const cancelBtn = document.getElementById('cancelEdit');
  const editContent = document.getElementById('editContent');
  const editFontSize = document.getElementById('editFontSize');
  const editReminder = document.getElementById('editReminder');
  const colorOptions = document.querySelectorAll('.color-option');

  let currentNote = null;

  // Get current note data
  chrome.storage.local.get(['notes'], (result) => {
    currentNote = result.notes.find(n => n.id === noteId);
    if (currentNote) {
      // Set current values
      editContent.innerHTML = currentNote.content;
      editFontSize.value = currentNote.fontSize || '14px';
      editReminder.value = currentNote.reminder || '';
      
      // Set current color
      colorOptions.forEach(option => {
        if (option.dataset.color === currentNote.color) {
          option.classList.add('selected');
        }
      });
    }
  });

  // Color picker functionality
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      colorOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
    });
  });

  // Save changes
  const saveChanges = () => {
    if (!currentNote) return;

    const selectedColor = document.querySelector('.color-option.selected');
    const updatedNote = {
      ...currentNote,
      content: editContent.innerHTML,
      fontSize: editFontSize.value,
      color: selectedColor ? selectedColor.dataset.color : currentNote.color,
      reminder: editReminder.value || null,
      lastEdited: new Date().toISOString()
    };

    chrome.storage.local.get(['notes'], (result) => {
      const notes = result.notes.map(note => 
        note.id === noteId ? updatedNote : note
      );

      chrome.storage.local.set({ notes }, () => {
        modal.style.display = 'none';
        loadNotes(); // Refresh the note list
      });
    });
  };

  // Event listeners
  closeBtn.onclick = () => modal.style.display = 'none';
  cancelBtn.onclick = () => modal.style.display = 'none';
  saveBtn.onclick = saveChanges;

  // Close modal if clicking outside
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };

  // Show modal
  modal.style.display = 'block';
};

  loadNotes();
});