// Saves options to chrome.storage
function save_options() {
  var rulesJson = document.getElementById('rules').value;
  try {
    JSON.parse(rulesJson);
  } catch(err) {
    var status = document.getElementById('status');
    status.textContent = "Error parsing JSON: " +  err.message;
    setTimeout(function() {
      status.textContent = '';
    }, 5000);
    return;
  }
  chrome.storage.sync.set({
    rulesJsonString: rulesJson
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restore the current rules json from chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    rulesJsonString: "",
  }, function(items) {
    document.getElementById('rules').value = items.rulesJsonString;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
document.getElementById('restore').addEventListener('click',
    restore_options);
