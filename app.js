var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fileUpload = require('express-fileupload')
var fs = require('fs')
var indexRouter = require('./routes/index');
var uploadRouter = require('./routes/upload');

var app = express();

const uploads_path = 'public/uploads';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/upload', uploadRouter);
app.use(fileUpload({
  createParentPath: true
}));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log(err);
  // render the error page
  res.status(err.status || 500);
  res.render('error.ejs');
});

// Deletes all files before the app starts
fs.readdir(uploads_path, (err, files) => {
  if (err) throw err;
  for (const file of files) {
    fs.unlink(path.join(uploads_path, file), err => {
      if (err) throw err;
    });
  }
});

module.exports = app;
