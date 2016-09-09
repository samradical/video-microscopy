const { dialog } = require('electron').remote
const readDir = require('readdir')
const BaseStage = require('./baseStage')
const _ = require('lodash')
const path = require('path')
const Q = require('bluebird')
const moment = require('moment')
var fs = require('fs-extra');

const EXEC = require('child_process').exec
module.exports = class Organisation extends BaseStage {
  constructor(config) {
    super(config)

    this.outputEl = document.getElementById('stage2-output')
    this.settings2El = document.getElementById('stage2-settings2')

    this._fileTypes = _.flatten(this.config.fileTypes.map(type => {
      return [`**.${type}`, `**.${type.toUpperCase()}`]
    }))

    const organiseBtn = document.getElementById('btn-organise')
    this.organiseOut = document.getElementById('stage2-organise-out')
    this.convertOut = document.getElementById('stage2-convert-out')
    this.organiseOutProg = document.getElementById('stage2-organise-out-prog')
    const convertBtn = document.getElementById('btn-convert')

    organiseBtn.addEventListener('click', () => {
      this.organiseTheFiles()
    })
    convertBtn.addEventListener('click', () => {
      this.convert()
    })

  }

  saveConfig() {
    super.saveConfig()
    this._findAllTimeSpotPaths()
    this._updateOrganisationSettings()
  }

  reload() {
    this._findAllTimeSpotPaths()
    this._updateOrganisationSettings()
  }

  _updateOrganisationSettings() {
    let _str =
      `
    ${this.config.duplicateTheFiles ? 'You are set to <strong>duplicate</strong> the files when organising them' :
    'You are set to <strong>move</strong> the files when organising them into a new structure'}
    `

    _str += `(config: duplicateTheFiles)`
    this.updateDisplayEl(_str, this.settings2El)
  }

  _findAllTimeSpotPaths() {
    let _in = this.config.inputDirectory
    if (_in) {
      this._timespots = readDir.readSync(_in, ['*/'], readDir.INCLUDE_DIRECTORIES + readDir.NON_RECURSIVE + readDir.ABSOLUTE_PATHS)
    }
  }

  //*******************
  //PATTERNS
  //*******************

  setPatterns(patterns) {
    this._findAllTimeSpotPaths()
    let _in = this.config.inputDirectory
    if (_in) {
      var filesArray = readDir.readSync(_in,
          this._fileTypes, readDir.ABSOLUTE_PATHS)
        .filter(p => {
          let stat = fs.statSync(p)
            //its in bytes
          return stat.size > this.config.ignoreFilesBelowFileSize * 1000
        });

      this._groupedFilesByPatterns = patterns.map(pattern => {
        return this._findAllFilesWithAPattern(filesArray, pattern)
      })

      this._createAbnormal(this._groupedFilesByPatterns)
    }
  }

  _createAbnormal(groups) {
    let _abnormals = groups.filter(o => {
        return o.abnormal === true
      })
      .map(val => {
        return JSON.stringify(val)
      })
      //output
    let _outstr = _abnormals.length ? `
    Got ${groups.length} groups, but \n
    Found abnormal: \n
    ${_abnormals.join('\n')}
    ` : `Got ${groups.length} groups!`

    this.updateDisplayEl(_outstr, this.outputEl)
  }

  /*
  HERE
  */
  _listStatsForEachGroup(groups, outputString) {
    _.each(groups, group => {})
  }


  _padLeft(value, padValuesWithZeros) {
    var str = "" + value
    var pad = ''
    for (var i = 0; i <= padValuesWithZeros; i++) {
      pad += '0'
    }
    return pad.substring(0, pad.length - str.length) + str
  }

  _findAllFilesWithAPattern(files, pattern) {
    let _paths = files.filter(p => {
      return p.indexOf(pattern) > -1
    })

    //sort
    let _timecodePaths = _paths.map(p => {
      let stat = fs.statSync(p)
      return [p, moment(stat.birthtime).unix()]
    }).sort((a, b) => {
      return a[1] - b[1];
    }).map((a, i) => {
      let _p = path.parse(a[0])
        //see if it has been renames
      if (_p.base.charAt(5) === '0') {
        return a[0]
      }
      let _newName = path.join(_p.dir, this._padLeft(i, 30) + _p.base)
      fs.renameSync(a[0], _newName)
      return _newName
    });

    //rename
    return {
      paths: _timecodePaths,
      abnormal: !_paths.length,
      pattern: pattern
    }
  }

  //*******************
  //MOVING FILES
  //*******************


  organiseTheFiles() {
    return new Q((yes, no) => {
      if (this._groupedFilesByPatterns) {
        let _out = this.config.outputDirectory
        if (_out) {
          let _p = []
          this.updateDisplayEl(`Busy!!!`, this.organiseOutProg)
          _.each(this._groupedFilesByPatterns, (group) => {
            _p.push(this._copyPatternGroup(group))
              /*_.each(group.paths, (filePath) => {
                _p.push(this._copyAFile(filePath, group.pattern))
              })*/
          })
          Q.all(_p).then((patterns) => {
            this.updateDisplayEl(`Complete!!!`, this.organiseOutProg)
            yes(patterns)
          })
        }
      } else {
        no()
      }
    })
  }

  convert() {
    this.organiseTheFiles().then(patterns => {
      let _c = 0
      Q.map(patterns, (pattern) => {
        let _p = pattern.split('/')
        _p = _p[_p.length - 1]
        let _save = path.join(this.config.outputDirectory, _p)
        let _macro = path.join(this.config.tempPath, `macro${_c}.ijm`)
        let _str = `print("Start")
        run("Image Sequence...", "open=${pattern} sort");
        saveAs("Tiff", "${_save}.tif");
        print("End")
        close();
        run("Quit");`
        fs.writeFileSync(_macro, _str, 'utf-8')
        let _cmd = `${this.config.imageJLocation} --headless -macro ${_macro} > output.txt`
        _c++
        return this._runConvertCommand(_cmd)

      }, { concurrency: 1 }).then(() => {
        this.convertOut.value = "All conversions done!"
      }).error((err) => {
        console.log(err);
        this.convertOut.value = err.toString()
      })
    })
  }

  _runConvertCommand(cmd) {
    this.convertOut.value += cmd
    return new Q((yes, no) => {
      let ls = EXEC(cmd, (error, stdout, stderr) => {
        if (error) {
          console.log(error.stack);
          console.log('Error code: ' + error.code);
          console.log('Signal received: ' + error.signal);
          no(new Error(error.signal))
        }
      });

      ls.on('exit', (code) => {
        this.convertOut.value += "\nSuccess!"
        this.convertOut.value += "\n"
        this.convertOut.value += "\n"
        yes()
      });
    })
  }

  _moveAFile(p) {
    let _p = path.parse(p)
    console.log(_p);
    /*fs.move('foo.txt', 'bar.txt', function(err) {
        if (err) {
          throw err;
        }

        console.log("Moved 'foo.txt' to 'bar.txt');
        });
    }*/
  }

  _copyPatternGroup(group) {
    return new Q((yes, no) => {
      let _out = this.config.outputDirectory
      let _patternDir = path.join(_out, group.pattern)
      let _p = []
      _.each(group.paths, (filePath) => {
        _p.push(this._copyAFile(filePath, group.pattern))
      })
      Q.all(_p).then((patterns) => {
        let _str = this.organiseOut.innerHTML
        this.updateDisplayEl(`${_str}\nCopied ${group.pattern}`, this.organiseOut)
        yes(_patternDir)
      })
    })
  }

  _copyAFile(p, pattern) {
    return new Q((yes, no) => {
      let _p = path.parse(p)
      let _out = this.config.outputDirectory
      let _patternDir = path.join(_out, pattern)
      let _oFile = path.join(_patternDir, _p.base)
      if (!fs.existsSync(_patternDir)) {
        fs.mkdirpSync(_patternDir)
      }
      if (!fs.existsSync(_oFile)) {
        fs.copy(p, _oFile, function(err) {
          if (err) {
            throw err;
          }
          yes({ pattern: pattern, dir: _patternDir })
        });
      } else {
        yes({ pattern: pattern, dir: _patternDir })
      }
    })
  }

  updateDisplay(el) {}
}
