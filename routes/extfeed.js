'use strict';
var db = require('../db');
var moment = require('moment');
var request = require('request');
var FeedParser = require('feedparser');

var cache = new Map();

// Expire from cache all downloads older than 60 minutes
function cleanCache() {
    console.log('@@cleanCache() size:', cache.size);
    cache.forEach(function(value, key, map) {
        if (Date.now() - value.lastDownloaded > 60*60*1000) {
            console.log('cleanCache(): id',key,'expired. Deleting.');
            map.delete(key);
        }
    });
}

// Render external feeds of a user
exports.feeds = function (req, res) {
    console.log('@@@feeds user:', req.session.username);
    db.getExtFeeds(req.session.username, function (err, feeds) {
        //console.log('@@@feeds:', feeds);
        res.render('extfeeds', {
            title: 'External feeds for ' + req.session.username,
            user: req.session.username,
            error: err,
            feeds: feeds
        });
    });
};

// Delete external feed
exports.deleteFeed = function (req, res) {
    console.log('Deleting feed' + req.params.id);
    db.deleteExtFeed(req.params.id, req.session.username);
    res.redirect('..');
};

// Add new external feed
exports.addFeed = function (req, res) {

    if (!req.body.url || !req.body.url.startsWith('http')) {
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
            console.log('addFeed() error:',err, err.stack);
            //return res.render('extfeeds', {error: err});
            return res.redirect('extfeeds?err='+err.message);
        }
        if (meta.title)
            db.addExtFeed(req.session.username, req.body.url, meta.title,
                        function(err, result) {
                            console.log('@@@addfeed: lastID:',this.lastID);
                        });
        res.redirect('extfeeds');
    }
};

// Add clicked entry from an external feed into personal feed
exports.addToPPFeed = function (req, res) {
    console.log('addToPPFeed',req.body, req.params.id);

    if (cache.get(req.params.id)) {
        console.log('Searching cache for guid:', req.body.guid);
        var item = cache.get(req.params.id).items.find(itm => itm.guid === req.body.guid);
        if (item) {
            console.log('@@found item:');
            console.log(item.title);
            console.log(item.description ? item.description.substring(0,77):'');
            console.log(item.enclosures);
            let enclosure = item.enclosures.find(enc => enc.type && enc.type.startsWith('audio'));
            if (enclosure && enclosure.url) {
                console.log('Adding new item to personal feed:', item.title);
                db.addItem(req.session.username, enclosure.url, item.title,
                    item.description, item.link);
            }
        } else {
            console.log('Error: guid not found:', req.body.guid);
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
        console.log('@@@Got feed from cache');
        return res.render('extfeed', cache.get(req.params.id));
    } else {
        console.log('Downloading feed');
        db.getExtFeed(req.params.id, downloadFeed);
    }
//    db.getExtFeed(req.params.id, function (err, feedArr) {
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
                return done(new Error('Bad status code'));
            stream.pipe(feedparser);
        });

        feedparser.on('error', done);
        feedparser.on('end', done);
        feedparser.on('readable', function() {
            var stream = this;
            var item;

            while (item = stream.read()) {
                //console.log('@@item=',item);
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
            console.log('@@caching feed at', feed.lastDownloaded);
            //cache[req.params.id] = feed;
            cache.set(req.params.id, feed);
            return res.render('extfeed', feed);
        }
    }
};
