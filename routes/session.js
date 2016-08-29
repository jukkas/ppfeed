var db = require('../db');
var hash = require('./hash');

exports.ensureLoggedIn = function(req, res, next) {
    if (req.session.username) {
        next();
    } else {
        res.redirect('/');
    }
}

exports.ensurePersonal = function(req, res, next) {
    // Logged in user may only access their own page
    if (req.params.user === req.session.username) {
        next();
    } else {
        res.redirect('/');
    }
}

exports.login = function(req, res) {
    if (!req.body.uname || !req.body.pword) {
        return res.redirect('/');
    }

    db.getUser(req.body.uname, function(err, result) {
        if (err) {
            console.error('Login db failure:', err);
            return res.redirect('/');
        }
        if (result.length < 1) {
            console.log('Login failure: unknown username:', req.body.uname);
            return res.redirect('/');
        }
        hash.hash(req.body.pword, result[0].salt, function (err, ohash) {
            if (ohash != result[0].hash) {
                console.log('Login failure: incorrect password for ',
                        req.body.uname);
                return res.redirect('/');
            }
            req.session.username = req.body.uname;
            res.redirect('/'+req.session.username);
        });
    });
}

exports.logout = function(req, res) {
    delete req.session.username;
    req.session = null;
    res.redirect('/');
}
