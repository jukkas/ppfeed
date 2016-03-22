var db = require('../db');
var moment = require('moment');
var auth = require('./auth');
var bootvars = require('../bootvars');

if (!String.prototype.encodeHTML) {
    String.prototype.encodeHTML = function () {
        return this.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };
}

// GET /register
exports.register = function (req, res) {
    res.render('register', {
        title: 'Register for ppfeed',
        admin: global.admins ? false : true
    });
};

// POST /register
exports.newUser = function (req, res) {

    var invalidNames = ['login','logout','register','items','admin'];
    if (!req.body.uname || !/^[a-z0-9]+$/i.test(req.body.uname) ||
        invalidNames.indexOf(req.body.uname) > -1) {
        return res.redirect('/register?error=invaliduname');
    }

    if (!req.body.pword || !req.body.pword2 ||
        req.body.pword !== req.body.pword2 ||
        req.body.pword.length < 2) {
        return res.redirect('/register?error=invalidpword&?uname=' +
                            req.body.uname.encodeHTML());
    }

    auth.hash(req.body.pword, function (err, hash, salt) {
        //console.log('@@user', req.body.uname, 'hash:', hash, 'salt:', salt);
        db.addUser(req.body.uname, hash, salt, function (err) {
            if (err) {
                console.dir(err);
                return res.redirect('/register?error=uname');
            }
            console.log('@@@admins', bootvars.admins);
            if (!bootvars.admins.length) {
                console.log('Adding administrator', req.body.uname);
                db.addAdmin(req.body.uname, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        bootvars.admins.push(req.body.uname);
                    }
                });
            }
            req.session.username = req.body.uname;
            res.redirect('/' + req.session.username);
        });
    });
};

