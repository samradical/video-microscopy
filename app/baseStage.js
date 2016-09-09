const S = require('./storage')
module.exports = class BaseStage {

  constructor(config) {
    this._config = config
  }

  get config() {
    return this._config.getConfig()
  }

  reload(){
    this.updateDisplay(this.settingsEl)
  }

  saveConfig(c) {
    S.setConfig(c)
  }

  updateDisplay(el){
  }

  updateDisplayEl(string, el){
    el.innerHTML = string
  }

}
