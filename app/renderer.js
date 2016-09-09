// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const fs = require('fs')
var tmp = require('tmp');

const config = require('./config')
const Storage = require('./storage')

const Stage1 = require('./stage1')
const Stage2 = require('./stage2')
const FileOrganisation = require('./fileOrganisation')

//let config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'))

tmp.dir(function _tempDirCreated(err, path, cleanupCallback) {
  if (err) throw err;
  config.tempPath = path
});

Storage.init(config)

const stage1 = new Stage1(Storage)
const stage2 = new Stage2(Storage)
const fileOrganisation = new FileOrganisation(Storage)
const reloadBtn = document.getElementById('btn-reload')
reloadBtn.addEventListener('click', () => {
  stage1.reload()
  fileOrganisation.reload()
})

fileOrganisation.setPatterns(stage2.patterns)



fileOrganisation.reload()
stage1.reload()
