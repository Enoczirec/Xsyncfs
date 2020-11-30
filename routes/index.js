var express = require('express');
var fs = require('fs');
var path = require('path');

var router = express.Router();
var CronJob = require('cron').CronJob;
var CronTime = require('cron').CronTime;

const { 
  getBuffer, 
  getSpeculator, 
  getDisk, 
  getDiskBuffer,
  getFile, 
  commitBufferToDisk, 
  setSuccessRate, 
  getSuccessRate, 
  nuke,
  updateSpeculator,
} = require('../src/xsyncfs.js');

let timer = 10;
let content = "";
const uploads_path = 'public/uploads';


router.get('/', function (req, res, next) {
  const disk_buffer = getDiskBuffer();
  const buffer = getBuffer();
  const disk = getDisk();
  const speculator = getSpeculator();
  const speculative = getSuccessRate();
  res.render('files.ejs', { timer, speculative, buffer, disk, speculator, disk_buffer, content })
});

router.post('/open/:fileName', function(req, res, next) {
  const file = getFile(req.params.fileName);
  setContent(file.content);
  res.redirect('/');
});

router.post('/config', function(req, res, next) {
  const body = req.body;
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

router.post('/retry/:processId', function(req, res, next) {
  const processId = req.params.processId;
  updateSpeculator(processId)
  res.redirect('/');
})

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

module.exports = router;
