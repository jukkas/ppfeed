'use strict';
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var swig = require('swig-templates');
var session = require('cookie-session');
var expressValidator = require('express-validator');

var routes = require('./routes/index');
var sessionRoute = require('./routes/session');

var app = express();

app.disable('x-powered-by');
// view engine setup
app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.set('view cache', false); // Swig will cache templates
//temp disable caching
//swig.setDefaults({ cache: false });

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('[:date] :remote-addr :method :url :status :res[content-length] ":referrer" ":user-agent"'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator(sessionRoute.customValidators));
app.use(express.static(path.join(__dirname, 'public')));

// Cookie based session
app.use(session({
    name: 'SES',
    secret: process.env.PPFEED_SESSION_SECRET || '5dx`h2}K*mA86<V4'
}))

// Routes
app.get('/health', function (req, res) {
  res.send('OK');
});

app.use('/', routes);

// Start server
app.listen(process.env.NODE_PORT || 3000, process.env.NODE_IP || 'localhost', function() {
    console.log('Express server running at port', process.env.NODE_PORT || 3000);
});
