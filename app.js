require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const createError = require('http-errors');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const swig = require('free-swig');
const session = require('cookie-session');

const routes = require('./routes');

const app = express();

app.use(helmet({
    contentSecurityPolicy: false, // I want my local development to work
    hsts: false, // I want my local development to work
  })
);

// view engine setup
app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.set('view cache', false); // Swig will cache templates
//temp disable caching
//swig.setDefaults({ cache: false });

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('[:date] :remote-addr :method :url :status :res[content-length] ":referrer" ":user-agent"'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Cookie based session
app.use(session({
    name: 'SES',
    secret: process.env.PPFEED_SESSION_SECRET || '5dx`h2}K*mA86<V4',
    sameSite: 'strict',
    maxAge: 365 * 24 * 60 * 60 * 1000   // 365 days
}))

// Routes
app.get('/health', (req, res) => {
  res.send('OK');
});

app.use('/', routes);

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
