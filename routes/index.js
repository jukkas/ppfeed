const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');

const { ensureLoggedIn, ensurePersonal, login, logout, register } = require('../controllers/session.js');
const { personalItems, podcastRss, itemAdd, itemDelete } = require('../controllers/feed.js');
const { extFeeds, extFeedsAdd, extFeedsDelete, extFeedsAddToPPFeed, extFeedsGetFeed } = require('../controllers/extfeed');

/* Home page -> user specific or login */
router.get('/', (req, res) => {
    if (req.session.username) {
        res.redirect(req.session.username);
        return;
    }
    res.redirect('login.html');
});

// User session
router.post('/login', asyncHandler(async (req, res, next) => {
    await login(req, res);
}));
router.get('/logout', logout);

// Items
router.post('/items', ensureLoggedIn, asyncHandler(async (req, res, next) => {
    await itemAdd(req, res);
}));
router.post('/items/:id/delete', ensureLoggedIn, asyncHandler(async (req, res, next) => {
    await itemDelete(req, res, req.params.id);
}));

// Extfeeds
router.get('/extfeeds', ensureLoggedIn, asyncHandler(async (req, res, next) => {
    await extFeeds(req, res);
}));
router.post('/extfeeds', ensureLoggedIn, asyncHandler(async (req, res, next) => {
    await extFeedsAdd(req, res);
}));

router.get('/extfeeds/:id', ensureLoggedIn, extFeedsGetFeed);
router.post('/extfeeds/:id/delete', ensureLoggedIn, extFeedsDelete);
router.post('/extfeeds/:id', ensureLoggedIn, extFeedsAddToPPFeed);

/* Personal feeds */
router.get('/:username', ensureLoggedIn, ensurePersonal, asyncHandler(async (req, res, next) => {
    await personalItems(req, res, req.params.username);
}));
router.get('/:username/rss', asyncHandler(async (req, res, next) => {
    await podcastRss(req, res, req.params.username);
}));


router.post('/register', register);


module.exports = router;
