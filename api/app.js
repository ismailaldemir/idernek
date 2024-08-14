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

const compression = require('compression');
// i18next yapılandırması için gerekli dosyayı dahil et
const i18next = require('./i18n');
const i18nextMiddleware = require('i18next-http-middleware');
const useragent = require('express-useragent');
const userAgentMiddleware = require('./middleware/userAgentMiddleware');


if (typeof global === 'undefined') {
  global = {};
} else if (typeof globalThis !== 'undefined') {
  global = globalThis;
}

var app = express();

// i18next'i middleware olarak kullanma
app.use(i18nextMiddleware.handle(i18next));

// CORS'u etkinleştirme
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL ile eşleşecek şekilde güncelleme
  credentials: true, // Çerezler veya diğer kimlik bilgilerini etkinleştirme
}));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Gzip sıkıştırmasını etkinleştir
app.use(compression({
  threshold: 0 // 0 bayttan büyük olan tüm yanıtları sıkıştır
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(useragent.express());
app.use(userAgentMiddleware);


app.get('/test', (req, res) => {
  res.send('Hello World!');
});


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
