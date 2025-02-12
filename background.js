// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log('Enhanced Sticky Notes installed');
});

// Handle alarms for reminders
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('reminder-')) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Sticky Note Reminder',
      message: 'You have a pending sticky note reminder!'
    });
  }
});