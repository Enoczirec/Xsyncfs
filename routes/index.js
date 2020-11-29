var express = require('express');
var fs = require('fs')
var path = require('path')
var util = require('util')

var router = express.Router();
var CronJob = require('cron').CronJob;
var CronTime = require('cron').CronTime;

const { getBuffer, getSpeculator, getDisk, getDiskBuffer, getFile, commitBufferToDisk, setSuccessRate, nuke } = require('../src/xsyncfs.js');

let timer = 10;
let content = "";
let time_counter = 0;
const uploads_path = 'public/uploads';


router.get('/', function (req, res, next) {
  const testFolder = path.join(__dirname, '../public/uploads')
  var readdir = util.promisify(fs.readdir)
  const disk_buffer = getDiskBuffer();
  const buffer = getBuffer();
  const disk = getDisk();
  const speculator = getSpeculator();
  return readdir(testFolder)
    .then(files => {
      res.render('files.ejs', { files, buffer, disk, speculator, disk_buffer, content })
    })
    .catch(next)
});

router.post('/open/:fileName', function(req, res, next) {
  const file = getFile(req.params.fileName);
  setContent(file.content);
  res.redirect('/');
});

router.post('/config', function(req, res, next) {
  const body = req.body;
  console.log(body);
  if(body.timer != null && body.timer != '') {
    setTimer(body.timer);
  }
  setSuccessRate(body.speculative);
  res.redirect('/');
});

router.post('/nuke', function(req, res, next) {
  fs.readdir(uploads_path, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.unlink(path.join(uploads_path, file), err => {
        if (err) throw err;
      });
    }
  });
  nuke();
  res.redirect('/');
});

var job = new CronJob(`*/${timer} * * * * *`, function () {
  commitBufferToDisk()
}, null, true, 'America/Mexico_City');

job.start();

const setTimer = (new_timer) => {
  job.stop();
  timer = new_timer;
  job.setTime(new CronTime(`*/${timer} * * * * *`));
  job.start();
};

const setContent = (new_content) => {
  content = new_content;
};

const getTimeCounter = () => {
  return time_counter;
}

const setTimeCounter = (timer) => {
  time_counter += timer;
}

module.exports = router;
