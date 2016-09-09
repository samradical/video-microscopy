const { clipboard } = require('electron')
const S = (() => {

  const settingsArea = document.getElementById('config')
  const reloadBtn = document.getElementById('btn-reload')

  reloadBtn.addEventListener('click', () => {
    setConfig(JSON.parse(settingsArea.value))
  })

  function storageAvailable(type) {
    try {
      var storage = window[type],
        x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return false;
    }
  }

  if (storageAvailable('localStorage')) {} else {
    // Too bad, no localStorage for us
  }

  function _display() {
    settingsArea.value = JSON.stringify(getConfig(), null, 4)
  }

  function setConfig(c) {
    localStorage.setItem('config', JSON.stringify(c, null, 4));

    _display()
  }

  function getConfig(c) {
    return JSON.parse(localStorage.getItem('config'));
  }

  function init(c) {
    if (!localStorage.getItem('config')) {
      console.log("No Config saved!");
      setConfig(c)
    } else {
      _display()
    }
  }

  return {
    init: init,
    setConfig: setConfig,
    getConfig: getConfig
  }
})()

module.exports = S
