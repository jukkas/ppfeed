'use strict';
var bcrypt = require('bcrypt');
const saltRounds = 10;
var db = require('../db');

// Custom validator for express-validator: reserve some usernames
exports.customValidators = {
    customValidators: {
        isNotPreReserved: function(username) {
            return (['login','logout','register','items','admin']
                    .indexOf(username) === -1);
        }
    }
};

exports.ensureLoggedIn = function(req, res, next) {
    if (req.session.username) {
        next();
    } else {
        res.redirect('../');
    }
};

exports.ensurePersonal = function(req, res, next) {
    // Logged in user may only access their own page
    if (req.params.user === req.session.username) {
        next();
    } else {
        res.redirect('../');
    }
};

exports.login = function(req, res) {
    req.checkBody('uname', 'Empty username').notEmpty();
    req.checkBody('pword', 'Empty password').notEmpty();
    if (req.validationErrors()) {
        console.log(req.validationErrors());
        res.redirect('../');
        return;
    };

    db.getUser(req.body.uname, function(err, result) {
        if (err) {
            console.error('Login db failure:', err);
            return res.redirect('../');
        }
        if (result.length < 1) {
            console.log('Login failure: unknown username:', req.body.uname);
            return res.redirect('../');
        }
        bcrypt.compare(req.body.pword, result[0].hash, function(err, matches) {
            if (!matches) {
                console.log('Login failure: incorrect password for ',
                        req.body.uname);
                return res.redirect('../');
            }
            req.session.username = req.body.uname;
            res.redirect('../'+req.session.username);
        });
    });
};

exports.logout = function(req, res) {
    delete req.session.username;
    req.session = null;
    res.redirect('../');
};

exports.register = function(req, res) {
    req.checkBody('uname', 'Invalid username')
        .notEmpty().isAlphanumeric().isNotPreReserved();
    req.checkBody('pword', 'Invalid password').isLength({min:2});
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.redirect('register');
        return;
    };
    bcrypt.hash(req.body.pword, saltRounds, function(err, hash) {
        db.addUser(req.body.uname, hash, function(err) {
            if (err) {
                return res.redirect('register');
            }
            console.log('New user:', req.body.uname);
            req.session.username = req.body.uname;
            res.redirect('../');
        });
    });
};
