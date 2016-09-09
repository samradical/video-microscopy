/*const { dialog } = require('electron').remote
console.log(dialog);

const stage1 = (() => {



  function setConfig(config) {
    _config = config
  }

  return {
    setConfig: setConfig
  }

})()

*/
const { dialog } = require('electron').remote
const BaseStage = require('./baseStage')
const os = require('os')

module.exports = class Stage1 extends BaseStage {
  constructor(config) {
    super(config)

    this.settingsEl = document.getElementById('stage1-settings')

    const inputBtn = document.getElementById('btn-input')
    const outputBtn = document.getElementById('btn-output')
    const imagejBtn = document.getElementById('btn-imagej')

    inputBtn.addEventListener('click', () => {
      dialog.showOpenDialog({ properties: ['openDirectory'] }, (path) => {
        let _c = this.config
        _c.inputDirectory = path[0]
        this.saveConfig(_c)
        this.updateDisplay(this.settingsEl)
      })
    })

    outputBtn.addEventListener('click', () => {
      dialog.showOpenDialog({ properties: ['openDirectory'] }, (path) => {
        let _c = this.config
        _c.outputDirectory = path[0]
        this.saveConfig(_c)
        this.updateDisplay(this.settingsEl)
      })
    })

    imagejBtn.addEventListener('click', () => {
      dialog.showOpenDialog({ properties: ['openFile'] }, (path) => {
        let _c = this.config
        _c.imageJLocation = path[0]
        if (os.platform() === 'darwin') {
          _c.imageJLocation += '/Contents/MacOS/ImageJ-macosx'
        }
        this.saveConfig(_c)
        this.updateDisplay(this.settingsEl)
      })
    })
  }

  updateDisplay(el) {
    let _str = `
    ImageJ location: <i>${this.config.imageJLocation}</i> <br>
    Input directory: <i>${this.config.inputDirectory}</i> <br>
    Output directory: <i>${this.config.outputDirectory}</i> <br>
    `
    this.updateDisplayEl(_str, el)
  }
}
