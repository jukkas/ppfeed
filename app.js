var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var swig = require('swig');
var session = require('cookie-session')

var routes = require('./routes/index');
//tmpl: var users = require('./routes/users');

var app = express();

// Bootstrap database and security keys
var bootvars = require('./bootvars');

// view engine setup
app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.set('view cache', false); // Swig will cache templates
//temp disable caching
swig.setDefaults({ cache: false });

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(morgan('[:date] :remote-addr :method :url :status :res[content-length] ":referrer" ":user-agent"'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
	name: 'SES',
	keys: [bootvars.SESSIONSECRET],
	//expires: ???,
	httpOnly: false,
	//secureProxy: true // if you do SSL outside of node
}))


app.use('/', routes);


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
