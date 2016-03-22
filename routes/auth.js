var db = require('../db');
var crypto = require('crypto');

var len = 64;
var iterations = 12000;

/**
 * Hashes a password with optional `salt`, otherwise
 * generate a salt for `pass` and invoke `fn(err, hash, salt)`.
 *
 * @param {String} password to hash
 * @param {String} optional salt
 * @param {Function} callback
 * @api public
 */

var hash = function (pwd, salt, fn) {
  if (3 == arguments.length) {
    crypto.pbkdf2(pwd, salt, iterations, len, function(err, h) {
        fn(err, h ? h.toString('base64'):null);
    });
  } else {
    fn = salt;
    crypto.randomBytes(len, function(err, salt){
      if (err) return fn(err);
      salt = salt.toString('base64');
      crypto.pbkdf2(pwd, salt, iterations, len, function(err, hash){
        if (err) return fn(err);
        fn(null, hash.toString('base64'), salt);
      });
    });
  }
};
exports.hash = hash;


exports.ensureLoggedIn = function(req, res, next) {
    if (req.session.username) {
        console.log('Session username data: '+req.session.username);
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
            console.log('Login db failure:', err);
            return res.redirect('/');
        }
        if (result.length < 1) {
            console.log('Login failure: unknown username:', req.body.uname);
            return res.redirect('/');            
        }
        hash(req.body.pword, result[0].salt, function (err, ohash) {
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
    res.redirect('/');
}