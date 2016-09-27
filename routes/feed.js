"use strict";
var db = require('../db');
var moment = require('moment');
var Entities = require('html-entities').XmlEntities;
var entities = new Entities();
var debug = require('debug')('ppfeed')

exports.items = function (req, res) {
    db.getUserItems(req.params.user, function (items) {
        res.render('items', {
            title: 'Personal feed for ' + req.params.user,
            user: req.params.user,
            items: items
        });
    });
};

exports.xml = function (req, res) {
    db.getUserItems(req.params.user, function (items) {
        if (items && items.length > 0) {
            var channelTitle = 'Personal Podcast Feed for ' + req.params.user;
            var channelLink = 'http://example.com'; //TODO: from config
            if (req.headers.host)
                channelLink = 'http://' + req.headers.host;
            var channelImage = channelLink + '/ppfeed.png'; //TODO: from config

            res.writeHead(200, {
                "Content-Type": "application/rss+xml; charset=utf-8"
            });
            res.write('<?xml version="1.0" encoding="UTF-8"?>\n');
            res.write('<rss version="2.0">\n');
            res.write('<channel>\n  <title>' + channelTitle + '</title>\n');
            res.write('  <description>Personal feed of podcast episodes</description>\n');
            res.write('  <link>' + channelLink + '</link>\n');
            res.write('  <image>\n');
            res.write('    <title>' + channelTitle + '</title>\n');
            res.write('    <link>' + channelLink + '</link>\n');
            res.write('    <url>' + channelImage + '</url>\n');
            res.write('  </image>\n');
            for (var r = 0; r < items.length; r++) {
                res.write('  <item>\n');
                res.write('    <title>');
                res.write(entities.encode(items[r].title));
                res.write('</title>\n');
                if (items[r].link && items[r].link.length > 0) {
                    res.write('    <link><![CDATA[');
                    res.write(items[r].link);
                    res.write(']]></link>\n');
                }
                res.write('    <guid>');
                res.write(items[r].media_url.replace('&','_'));
                res.write('</guid>\n');
                res.write('    <description><![CDATA[');
                res.write(items[r].description ? entities.encode(items[r].description) : ' ');
                res.write(']]></description>\n');
                res.write('    <enclosure url="');
                let url = items[r].media_url;
                res.write(url);
                if (url.endsWith('.ogg') || url.endsWith('.oga')) {
                    res.write('" length="0" type="audio/ogg" />\n');
                } else {
                    res.write('" length="0" type="audio/mpeg" />\n');
                }
                res.write('    <category>Podcasts</category>\n');
                var pubDate = moment(items[r].time);
                res.write('    <pubDate>');
                res.write(pubDate.format('ddd, D MMM YYYY HH:mm:ss ZZ'));
                //res.write(items[r].time.toString() || ' ');
                res.write('</pubDate>\n');
                res.write('  </item>\n');
            }
            res.write('</channel>\n</rss>\n');
        } else {
            res.send(404, 'No matches!\n');
        }
        res.end();
    });
};

exports.deleteitem = function (req, res) {
    debug('req.body.item=' + req.body.item);
    db.deleteItem(req.body.item, req.session.username);
    res.redirect('../' + req.session.username);
};

exports.additem = function (req, res) {
    debug(req.body);
    req.checkBody('url', 'Invalid url').notEmpty()
        .isURL({allow_underscores: true, allow_trailing_dot:true });
    req.checkBody('title', 'Missing title').notEmpty();
    if (req.body.link)
        req.checkBody('link', 'Invalid link').optional()
            .isURL({ allow_underscores: true, allow_trailing_dot:true });
    req.sanitize('title').escape();
    req.sanitize('description').escape();

    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.redirect('../');
        return;
    };

    db.addItem(req.session.username, req.body.url, req.body.title,
        req.body.description, req.body.link);
    res.redirect('../' + req.session.username);
};
