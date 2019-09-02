'use strict';
const bcrypt = require('bcrypt');
const saltRounds = 10;
const db = require('../services/db');

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

exports.login = async function(req, res) {
    req.checkBody('uname', 'Empty username').notEmpty();
    req.checkBody('pword', 'Empty password').notEmpty();
    if (req.validationErrors()) {
        console.log(req.validationErrors());
        res.redirect('../');
        return;
    };

    const username = req.body.uname;
    const password = req.body.pword;

    try {
        const user = await db.getUser(username);
        if (!user)
            throw new Error(`Unknown username ${username}`)
        bcrypt.compare(password, user.hash, (err, matches) => {
            if (!matches) {
                console.log('Login failure: incorrect password for ', username);
                return res.redirect('../');
            }
            req.session.username = username;
            res.redirect('../' + username);
        });        
    } catch (err) {
        console.error('Login db failure:', err.message);
        return res.redirect('../');   
    }
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
        db.addUser({username: req.body.uname, hash})
        .then(() => {
            console.log('New user:', req.body.uname);
            req.session.username = req.body.uname;
            res.redirect('../');
        })
        .catch(err => {
            console.log(err);
            return res.redirect('register');
        })
    });
};
