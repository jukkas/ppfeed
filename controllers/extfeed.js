'use strict';
const { convert } = require('html-to-text');
const db = require('../services/db');
//const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fetch = require('node-fetch');
const FeedParser = require('feedparser');
const debug = require('debug')('ppfeed')


const cache = new Map();

// Expire from cache all downloads older than 60 minutes
function cleanCache() {
    cache.forEach(function (value, key, map) {
        if (Date.now() - value.lastDownloaded > 60 * 60 * 1000) {
            debug('cleanCache(): id', key, 'expired. Deleting.');
            map.delete(key);
        }
    });
}

// Render external feeds of a user
exports.extFeeds = function (req, res) {
    //res.clearCookie('error');
    db.getExtFeeds(req.session.username)
        .then(feeds => {
            res.render('extfeeds', {
                title: 'External feeds for ' + req.session.username,
                user: req.session.username,
                //error: req.cookies ? req.cookies.error:null,
                feeds: feeds,
            });
        })
        .catch(err => {
            res.render('extfeeds', {
                title: 'External feeds for ' + req.session.username,
                user: req.session.username,
                error: err,
                feeds: [],
            });
        });
};

// Delete external feed
exports.extFeedsDelete = function (req, res) {
    debug('Deleting feed' + req.params.id);
    db.deleteExtFeed({ id: req.params.id, username: req.session.username })
        .catch(err => console.log(err));
    res.redirect('..');
};

// Add new external feed
exports.extFeedsAdd = function (req, res) {
    if (!req.body.url || !req.body.url.startsWith('http')) {
        console.log('addFeed: Invalid url ' + req.body.url);
        res.cookie('error', 'Invalid url ' + req.body.url);
        return res.redirect('extfeeds');
    }
    var meta;
    // Download feed (to get title)
    const r = fetch(req.body.url);
    const feedparser = new FeedParser();

    r.then(function (res) {
        if (res.status !== 200) {
            return done(new Error('Bad status code'));
        } else {
            res.body.pipe(feedparser);
        }
    }, function (err) {
        return done(err);
    });
    feedparser.on('error', done);
    feedparser.on('end', done);
    feedparser.on('meta', function (feedMeta) {
        meta = feedMeta;
        done();
    });

    function done(err) {
        if (err) {
            console.error('addFeed() error:', err, err.stack);
            //return res.render('extfeeds', {error: err});
            res.cookie('error', err.message);
            return res.redirect('extfeeds');
        }
        if (meta.title) {
            db.addExtFeed({
                username: req.session.username,
                url: req.body.url,
                title: meta.title
            })
                .catch(err => console.log(err));
        }
        res.redirect('extfeeds');
    }
};

// Add clicked entry from an external feed into personal feed
exports.extFeedsAddToPPFeed = function (req, res) {
    debug('addToPPFeed', req.body, req.params.id);

    if (cache.get(req.params.id)) {
        debug('Searching cache for guid:' + req.body.guid);
        var item = cache.get(req.params.id).items.find(itm => itm.guid === req.body.guid);
        if (item) {
            debug(item.title);
            debug(item.description ? item.description.substring(0, 77) : '');
            debug(item.enclosures);
            let enclosure = item.enclosures.find(enc => enc.type && enc.type.startsWith('audio'));
            if (enclosure && enclosure.url) {
                debug('Adding new item to personal feed:', item.title);
                db.addItem({
                    username: req.session.username,
                    media_url: enclosure.url,
                    title: item.title,
                    description: item.description,
                    link: item.link
                })
                    .catch(err => console.log(err));
            }
        } else {
            console.warn('Error: guid not found:', req.body.guid);
        }
    } else {
        console.warn('Internal error: feed not found in cache');
    }
    res.redirect('..');
};

// Get single external feed from cache or download it + render it
exports.extFeedsGetFeed = async function (req, res) {

    cleanCache();

    if (cache.get(req.params.id)) {
        debug('Showing cached version');
        return res.render('extfeed', cache.get(req.params.id));
    }

    try {
        const feedArr = await db.getExtFeed(req.params.id);
        var feed = { meta: {}, items: [] };
        if (!feedArr || feedArr.length != 1)
            throw new Error('Feed not found');

        debug('Fetching from', feedArr[0].url);
        const r = fetch(feedArr[0].url);
        const feedparser = new FeedParser();
        r.then(function (res) {
            if (res.status < 200 || res.status > 299) {
                return done(new Error(`Bad status code ${res.statusCode}`));
            } else {
                res.body.pipe(feedparser);
            }
        }, function (err) {
            return done(err);
        });

        feedparser.on('error', parseErr);
        feedparser.on('end', done);
        feedparser.on('readable', function () {
            let stream = this;
            let item;

            while (item = stream.read()) {
                if (item.description && item.description.includes('<') && item.description.includes('>'))
                    item.description = convert(item.description);
                feed.items.push(item);
            }

            feed.meta = this.meta;
        });

        function parseErr(err) {
            feed.error = err;
        }

        function done(err) {
            err = err || feed.error;
            if (err) {
                console.log(err, err.stack);
                return res.render('extfeed', { error: err });
            }
            feed.lastDownloaded = new Date();
            cache.set(req.params.id, feed);
            return res.render('extfeed', feed);
        }

    } catch (err) {
        console.log(err, err.stack);
        return res.render('extfeed', { error: err });
    }
};
