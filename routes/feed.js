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
            let channelLink = 'http://' + (req.headers.host || 'localhost');
            let channelImage = channelLink + '/ppfeed.png'; //TODO: from config
            items.forEach(item => {
                if (item.media_url.endsWith('.ogg') ||
                    item.media_url.endsWith('.oga') ||
                    item.media_url.indexOf('.ogg?') != -1 ||
                    item.media_url.indexOf('.oga?') != -1) {
                        item.media_url_type = 'audio/ogg';
                } else {
                        item.media_url_type = 'audio/mpeg';
                }
                let pubDate = moment(item.time);
                item.pubDate = pubDate.format('ddd, D MMM YYYY HH:mm:ss ZZ');
                item.guid = item.media_url.replace('&','_');
            });
            res.set('Content-Type', 'application/rss+xml; charset=utf-8');
            res.render('xml', {
                channelTitle: 'Personal Podcast Feed for ' + req.params.user,
                channelLink: channelLink,
                channelImage: channelImage,
                items: items
            });
        } else {
            res.status(404).send('No podcasts!\n');
        }
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
