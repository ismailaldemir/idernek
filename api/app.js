require("core-js/stable");
require("regenerator-runtime/runtime");


if (process.env.NODE_ENV !== "production")
require('dotenv').config()

const cors = require('cors');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

if (typeof global === 'undefined') {
  global = {};
} else if (typeof globalThis !== 'undefined') {
  global = globalThis;
}

var app = express();

// CORS'u etkinleştirme
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL ile eşleşecek şekilde güncelleme
  credentials: true, // Çerezler veya diğer kimlik bilgilerini etkinleştirme
}));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', require('./routes/index'));

//app.use('/users', require('./routes/users'));
//app.use('/auditlogs', require('./routes/auditlogs'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
