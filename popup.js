document.addEventListener('DOMContentLoaded', () => {
  const newNoteBtn = document.getElementById('new-note');
  const manageNotesBtn = document.getElementById('manage-notes');
  const colorOptions = document.querySelectorAll('.color-option');
  const fontSizeSelect = document.getElementById('font-size');
  const reminderTime = document.getElementById('reminder-time');
  const setReminderBtn = document.getElementById('set-reminder');

  let currentNoteSettings = {
    color: '#fff9c4',
    fontSize: '14px'
  };

  // Create new note
  newNoteBtn.addEventListener('click', () => {
    const note = {
      id: Date.now(),
      content: '',
      position: { x: 20, y: 20 },
      ...currentNoteSettings,
      timestamp: new Date().toISOString()
    };

    chrome.storage.local.get(['notes'], (result) => {
      const notes = result.notes || [];
      notes.push(note);
      chrome.storage.local.set({ notes }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'createNote', note });
        });
      });
    });
  });

  // Manage notes
  manageNotesBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'manager.html' });
  });

  // Color picker
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      currentNoteSettings.color = option.dataset.color;
      colorOptions.forEach(opt => opt.style.border = 'none');
      option.style.border = '2px solid #333';
    });
  });

  // Font size
  fontSizeSelect.addEventListener('change', (e) => {
    currentNoteSettings.fontSize = e.target.value;
  });

  // Set reminder
  setReminderBtn.addEventListener('click', () => {
    const reminderDate = new Date(reminderTime.value);
    if (reminderDate > new Date()) {
      chrome.alarms.create(`reminder-${Date.now()}`, {
        when: reminderDate.getTime()
      });
    }
  });
});
