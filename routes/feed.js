"use strict";
const htmlToText = require('html-to-text');
const db = require('../db');
const moment = require('moment');
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();
const debug = require('debug')('ppfeed')

exports.items = async function (req, res) {

    try {
        const items = await db.getUserItems({username: req.params.user});
        // Convert description from HTML to text (for UI tooltips)
        items.forEach(item => {
            if (item.description.includes('<') && item.description.includes('>'))
               item.description = htmlToText.fromString(item.description);
        });
        res.render('items', {
            title: 'Personal feed for ' + req.params.user,
            user: req.params.user,
            items: items
        });
    } catch (error) {
        res.render('error',{
            message: 'Error getting user items',
            error
        });
    }
};

exports.xml = async function (req, res) {

    const defaultCount = 20;
    let limit = parseInt(req.query.count) || defaultCount;   // By default return first 20 items/episodes
    if ('all' in req.query) { // 'all' query parameter -> return all items/episodes
        limit = 0;
    }
    try {
        const items = await db.getUserItems({username: req.params.user, limit});

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
    } catch (error) {
        res.render('error',{
            message: 'Error getting user items',
            error
        });
    }
};

exports.deleteitem = function (req, res) {
    debug('req.body.item=' + req.body.item);
    db.deleteItem({id: req.body.item, username: req.session.username})
    .catch(err => console.error(err));
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

    db.addItem({
        username: req.session.username,
        media_url:req.body.url,
        title:req.body.title,
        description:req.body.description,
        link: req.body.link
    })
    .catch(err => console.error(err));

    res.redirect('../' + req.session.username);
};
