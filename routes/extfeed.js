'use strict';
const htmlToText = require('html-to-text');
const db = require('../db');
const moment = require('moment');
const request = require('request');
const FeedParser = require('feedparser');
const debug = require('debug')('ppfeed')


const cache = new Map();

// Expire from cache all downloads older than 60 minutes
function cleanCache() {
    cache.forEach(function(value, key, map) {
        if (Date.now() - value.lastDownloaded > 60*60*1000) {
            debug('cleanCache(): id',key,'expired. Deleting.');
            map.delete(key);
        }
    });
}

// Render external feeds of a user
exports.feeds = function (req, res) {
    res.clearCookie('error');
    db.getExtFeeds(req.session.username, function (err, feeds) {
        let errorMsg = req.cookies ? req.cookies.error:null;
        if (err) errorMsg = err.message;
        res.render('extfeeds', {
            title: 'External feeds for ' + req.session.username,
            user: req.session.username,
            error: errorMsg,
            feeds: feeds
        });
    });
};

// Delete external feed
exports.deleteFeed = function (req, res) {
    debug('Deleting feed' + req.params.id);
    db.deleteExtFeed(req.params.id, req.session.username);
    res.redirect('..');
};

// Add new external feed
exports.addFeed = function (req, res) {
    if (!req.body.url || !req.body.url.startsWith('http')) {
        console.log('addFeed: Invalid url '+req.body.url);
        res.cookie('error','Invalid url '+req.body.url);
        return res.redirect('extfeeds');
    }
    var meta;
    // Download feed (to get title)
    var r = request(req.body.url);
    var feedparser = new FeedParser();
    r.on('error', done);
    r.on('response', function (resp) {
        var stream = this;
        if (resp.statusCode != 200)
            return done(new Error('Bad status code'));
        stream.pipe(feedparser);
    });

    feedparser.on('error', done);
    feedparser.on('end', done);
    feedparser.on('meta', function(feedMeta) {
        meta = feedMeta;
        done();
    });

    function done(err) {
         if (err) {
            console.error('addFeed() error:',err, err.stack);
            //return res.render('extfeeds', {error: err});
            res.cookie('error',err.message);
            return res.redirect('extfeeds');
        }
        if (meta.title)
            db.addExtFeed(req.session.username, req.body.url, meta.title,
                        function(err, result) {
                            debug('addfeed: added lastID:',this.lastID);
                        });
        res.redirect('extfeeds');
    }
};

// Add clicked entry from an external feed into personal feed
exports.addToPPFeed = function (req, res) {
    debug('addToPPFeed',req.body, req.params.id);

    if (cache.get(req.params.id)) {
        debug('Searching cache for guid:' + req.body.guid);
        var item = cache.get(req.params.id).items.find(itm => itm.guid === req.body.guid);
        if (item) {
            debug(item.title);
            debug(item.description ? item.description.substring(0,77):'');
            debug(item.enclosures);
            let enclosure = item.enclosures.find(enc => enc.type && enc.type.startsWith('audio'));
            if (enclosure && enclosure.url) {
                debug('Adding new item to personal feed:', item.title);
                db.addItem(req.session.username, enclosure.url, item.title,
                    item.description, item.link);
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
exports.getFeed = function (req, res) {

    cleanCache();

    if (cache.get(req.params.id)) {
        return res.render('extfeed', cache.get(req.params.id));
    } else {
        debug('Downloading feed');
        db.getExtFeed(req.params.id, downloadFeed);
    }
    function downloadFeed(err, feedArr) {
        var feed = {meta: {}, items: []};
        if (err || !feedArr || feedArr.length != 1)
            return done();

        var r = request(feedArr[0].url);
        var feedparser = new FeedParser();
        r.on('error', done);
        r.on('response', function (resp) {
            var stream = this;
            if (resp.statusCode != 200)
                return done(new Error(`Bad status code ${resp.statusCode}`));
            stream.pipe(feedparser);
        });

        feedparser.on('error', done);
        feedparser.on('end', done);
        feedparser.on('readable', function() {
            var stream = this;
            var item;

            while (item = stream.read()) {
                if (item.description.includes('<') && item.description.includes('>'))
                    item.description = htmlToText.fromString(item.description);
                feed.items.push(item);
            }

            feed.meta = this.meta;
        });

        function done(err) {
             if (err) {
                console.log(err, err.stack);
                return res.render('extfeed', {error: err});
            }
            feed.lastDownloaded = new Date();
            cache.set(req.params.id, feed);
            return res.render('extfeed', feed);
        }
    }
};
