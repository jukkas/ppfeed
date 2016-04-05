var express = require('express');
var router = express.Router();
var path = require('path');

var session = require('./session');
var feed = require('./feed');
var extfeed = require('./extfeed');


router.get('/', function(req, res) {
    if (req.session.username) {
        res.redirect(req.session.username);
        return;
    }
    res.render('login', { title: 'ppfeed' });
});

router.get('/ppfeed.png', function(req, res) {
    res.sendFile(path.join(__dirname, '..' ,'public/images/ppfeed.png'));
});

router.post('/login', session.login);
router.get('/logout', session.logout);

//Disabled for now
//router.get('/register', user.register);
//router.post('/register', user.newUser);

router.post('/delete', session.ensureLoggedIn, feed.deleteitem);
router.post('/add', session.ensureLoggedIn, feed.additem);
router.post('/items/:item/delete', session.ensureLoggedIn, session.ensurePersonal,
            feed.deleteitem);
router.post('/items/:item/add', session.ensureLoggedIn, session.ensurePersonal,
            feed.additem);

/* External feeds */
router.get('/extfeeds', session.ensureLoggedIn,
            extfeed.feeds);
router.post('/extfeeds', session.ensureLoggedIn, extfeed.addFeed);
router.get('/extfeeds/:id', session.ensureLoggedIn, extfeed.getFeed);
router.post('/extfeeds/:id/delete', session.ensureLoggedIn, extfeed.deleteFeed);
router.post('/extfeeds/:id', session.ensureLoggedIn, extfeed.addToPPFeed);

/* Personal feeds */
router.get('/:user', session.ensureLoggedIn, session.ensurePersonal, feed.items);

router.get('/:user/rss', feed.xml);


module.exports = router;
