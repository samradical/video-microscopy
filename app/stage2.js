const { dialog } = require('electron').remote
const BaseStage = require('./baseStage')
const _ = require('lodash')

module.exports = class Stage2 extends BaseStage {
  constructor(config) {
    super(config)

    this.settingsEl = document.getElementById('stage2-settings')
    this.outputEl = document.getElementById('stage2-output')


    const reloadBtn = document.getElementById('btn-reload')
    reloadBtn.addEventListener('click', () => {
      let _structure = this.config.structure
      console.log(_structure);
      this._calculate(_structure)
    })

    let _structure = this.config.structure
    this._calculate(_structure)
  }

  _calculate(_structure) {
    //this.outputEl.innerHTML = ""
    this._createGroupChunk([], _structure, (final) => {
      this._patterns = final
      this.updateDisplayEl(final.join('\n'), this.settingsEl)
    })

  }

  _padLeft(value, padValuesWithZeros) {
    var str = "" + value
    var pad = ''
    for (var i = 0; i <= padValuesWithZeros; i++) {
      pad += '0'
    }
    return pad.substring(0, pad.length - str.length) + str
  }

  get patterns() {
    return this._patterns
  }

  /*

  Looks like this but we flatten array everytime
  [B4_,

    [
      B4_s1
        [B4_s1_w1
        B4_s1_w2
        B4_s1_w3]
      B4_s2
        [B4_s2_w1
        B4_s2_w2
        B4_s2_w3]
      B4_s3
      B4_s4
    ]

    */

  _createGroupChunk(array, obj, callback) {
    let _self = this
    let _keys = obj.keys
    let _minValue = obj.values[0]
    let _maxValue = obj.values[1]
    let _next = obj.next
    let padValuesWithZeros = obj.padValuesWithZeros
    let seperatorBetweenGroups = obj.seperatorBetweenGroups || ""

    let _nextArray

    function _loop(previousIden = '') {
      let initialArray = []
        //for each of the items of the array
        //[B4_, B5_, B6_], or [B4_s1, B5_s1, B6_s1]
      _.each(_keys, (str) => {
        for (var i = _minValue; i <= _maxValue; i++) {
          //for each new group we add to a copy: B5_s1
          let _copy = previousIden
          let _v = padValuesWithZeros ? _self._padLeft(i, padValuesWithZeros) : i
            //B5_s1 += 'w1'
          _copy += `${str}${_v}${seperatorBetweenGroups}`
          initialArray.push(_copy)
        }
      })
      return initialArray
    }

    if (array.length) {
      //loop over layer [B4_, B5_, B6_]
      _nextArray = array.map(_loop)
    } else {
      //nothing to begin with
      _nextArray = _loop()
    }

    if (_next) {
      this._createGroupChunk(_.flatten(_nextArray), _next, callback)
    } else {
      callback(_.flatten(_nextArray))
    }

  }


  updateDisplay(el) {}
}
