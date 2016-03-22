var express = require('express');
var router = express.Router();

var bootvars = require('../bootvars');
var auth = require('./auth');
var user = require('./user');
var feed = require('./feed');


router.get('/', function(req, res) {
	if (req.session.username) {
        res.redirect('/'+req.session.username);
        return;
    }
    
	res.render('login', { title: 'ppfeed' });
});

router.get('/ppfeed.png', function(req, res) {
    res.sendfile('public/images/ppfeed.png');
});

router.post('/login', auth.login);
router.get('/logout', auth.logout);

router.get('/register', user.register);
router.post('/register', user.newUser);

router.post('/delete', auth.ensureLoggedIn, feed.deleteitem);
router.post('/add', auth.ensureLoggedIn, feed.additem);
router.post('/items/:item/delete', auth.ensureLoggedIn, feed.deleteitem);
router.post('/items/:item/add', auth.ensureLoggedIn, feed.additem);

router.get('/:user', auth.ensureLoggedIn, auth.ensurePersonal, feed.items);

router.get('/:user/rss', feed.xml);


module.exports = router;
