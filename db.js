'use strict';

var dataDir = process.env.PPFEED_DATA_DIR ||
                process.env.OPENSHIFT_DATA_DIR || __dirname;

var path = require('path');
var fs = require("fs");
var hash = require('./routes/hash'); // For hash

var dbFile = path.join(dataDir, 'ppfeed.db');
var dbExists = fs.existsSync(dbFile);

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(dbFile);


var addUser = function(username, hash, salt, callback) {
    var time = new Date().toISOString();
    var sql = 'INSERT INTO Users'+
              '(username, hash, salt, regtime, lasttime) VALUES '+
              '(?, ?, ?, ?, ?)';
    db.run(sql, username, hash, salt, time, time, callback,
        function(err, result) {});
}


db.serialize(function() {
    if(!dbExists) {
        db.run("CREATE TABLE Users (username TEXT NOT NULL UNIQUE," +
                "hash TEXT, salt TEXT, regtime DATETIME, lasttime DATETIME)",
                function(err, result) {});
        db.run("CREATE TABLE Items (id INTEGER PRIMARY KEY,username TEXT," +
                "media_url TEXT,title TEXT,description TEXT," +
                "link TEXT,time DATETIME)", function(err, result) {});
        db.run("CREATE TABLE ExtFeeds (id INTEGER PRIMARY KEY, username TEXT," +
                "url TEXT, title TEXT)", function(err, result) {});
        // Create default user
        var username = process.env.PPFEED_DEFAULT_USERNAME || 'j';
        var password = process.env.PPFEED_DEFAULT_PASSWORD || 'js';
        hash.hash(password, function (err, hash, salt) {
            addUser(username, hash, salt);
        });
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
        console.log('DELETE FROM Items WHERE id='+id,'AND username='+user);
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
            console.log(sql, username, media_url, title, description, link, currentTime);
            db.run(sql, username, media_url, title, description, link, currentTime);
    }
}

exports.getExtFeeds = function(username, callback) {
    db.all('SELECT * FROM ExtFeeds WHERE username=?', username, callback);
}

exports.deleteExtFeed = function(id, user, callback) {
    if (id && user) {
        console.log('DELETE FROM ExtFeeds WHERE id='+id,'AND username='+user);
        db.run('DELETE FROM ExtFeeds WHERE id=? AND username=?', id, user, callback);
    }
}

exports.addExtFeed = function(username, url, title, callback) {
    if (username && url && title) {
        var sql = 'INSERT INTO ExtFeeds'+
                '(username, url, title) VALUES '+
                '(?, ?, ?)';
        console.log(sql, username, url, title);
        db.run(sql, username, url, title, callback);
    }
}

exports.getExtFeed = function(id, callback) {
    db.all('SELECT * FROM ExtFeeds WHERE id = ?', id, callback);
}
