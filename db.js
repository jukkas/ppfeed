'use strict';

var bcrypt = require('bcrypt');
const saltRounds = 10;

var dataDir = process.env.PPFEED_DATA_DIR ||
                process.env.OPENSHIFT_DATA_DIR || __dirname;

var debug = require('debug')('ppfeed')
var path = require('path');
var fs = require("fs");

var dbFile = path.join(dataDir, 'ppfeed.db');
var dbExists = fs.existsSync(dbFile);

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(dbFile);


exports.addUser = function(username, hash, callback) {
    var time = new Date().toISOString();
    var sql = 'INSERT INTO Users'+
              '(username, hash, regtime, lasttime) VALUES '+
              '(?, ?, ?, ?)';
    db.run(sql, username, hash, time, time, callback);
}


db.serialize(function() {
    if(!dbExists) {
        console.log('Database not found. Creating...');
        db.run("CREATE TABLE Users (username TEXT NOT NULL UNIQUE," +
                "hash TEXT, regtime DATETIME, lasttime DATETIME)",
                function(err, result) {});
        db.run("CREATE TABLE Items (id INTEGER PRIMARY KEY,username TEXT," +
                "media_url TEXT,title TEXT,description TEXT," +
                "link TEXT,time DATETIME)", function(err, result) {});
        db.run("CREATE TABLE ExtFeeds (id INTEGER PRIMARY KEY, username TEXT," +
                "url TEXT, title TEXT)", function(err, result) {});
        db.run("CREATE TABLE Settings (key NOT NULL UNIQUE, value TEXT)",
                                        function(err, result) {});
        var hash = bcrypt.hashSync(password, saltRounds);
        exports.addUser(username, hash);
    }
});

exports.getUser = function(username, callback) {
    db.all('SELECT * FROM Users WHERE username = ?', username, callback);
}

exports.getUserItems = function(username, callback) {
   db.all('SELECT id, media_url, title, description, link, time '+
          'FROM Items WHERE username = ? ORDER BY id DESC', username,
          function(err, rows) {
              if (err) {
                  console.log(err);
              }
              callback(rows);
          });
}

exports.deleteItem = function(id, user) {
    if (id && user) {
        debug('DELETE FROM Items WHERE id='+id,'AND username='+user);
        db.run('DELETE FROM Items WHERE id=? AND username=?', id, user);
    }
}

exports.addItem = function(username, media_url, title, description, link) {
        if (username && media_url && title) {
                description = description || " ";
                var currentTime = new Date();
                var time = currentTime.toISOString();
                var sql = 'INSERT INTO Items'+
                  '(username, media_url, title, description, link, time) VALUES '+
                  '(?, ?, ?, ?, ?, ?)';
            debug(sql, username, media_url, title,
                description.substring(0, 20)+'...', link, currentTime);
            db.run(sql, username, media_url, title, description, link, currentTime);
    }
}

exports.getExtFeeds = function(username, callback) {
    db.all('SELECT * FROM ExtFeeds WHERE username=?', username, callback);
}

exports.deleteExtFeed = function(id, user, callback) {
    if (id && user) {
        debug('DELETE FROM ExtFeeds WHERE id='+id+' AND username='+user);
        db.run('DELETE FROM ExtFeeds WHERE id=? AND username=?', id, user, callback);
    }
}

exports.addExtFeed = function(username, url, title, callback) {
    if (username && url && title) {
        var sql = 'INSERT INTO ExtFeeds'+
                '(username, url, title) VALUES '+
                '(?, ?, ?)';
        debug(sql, username, url, title);
        db.run(sql, username, url, title, callback);
    }
}

exports.getExtFeed = function(id, callback) {
    db.all('SELECT * FROM ExtFeeds WHERE id = ?', id, callback);
}
