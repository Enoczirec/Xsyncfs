var express = require('express');
var router = express.Router();
var fs = require('fs')
var path = require('path')
var multer = require('multer')({
  dest: 'public/uploads'
});

const { saveToBuffer, saveDurability } = require('../src/xsyncfs');

router.post('/', [multer.single('attachment')], function (req, res, next) {

  if (req.file) {
    const fileData = storeWithOriginalName(req.file)
    if (req.body.type == 'durability') {
      saveDurability(fileData, fileData.process);
    } else {
      saveToBuffer(fileData, fileData.process);
    }
  }
  res.redirect('/');
});

const storeWithOriginalName = (file) => {
  var fullNewPath = path.join(file.destination, file.originalname)
  fs.renameSync(file.path, fullNewPath)
  const content = fs.readFileSync(fullNewPath, 'utf8');
  return {
    fileName: file.originalname,
    content,
    mimetype: file.mimetype,
    process: file.filename,
  }
};

module.exports = router