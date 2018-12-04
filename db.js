const dataDir = process.env.PPFEED_DATA_DIR ||
                process.env.OPENSHIFT_DATA_DIR || __dirname;

const debug = require('debug')('ppfeed')
const path = require('path');
const fs = require("fs");

const dbFile = path.join(dataDir, 'ppfeed.db');
const dbExists = fs.existsSync(dbFile);

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// Init
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
    }
});


const dbAll = (sql, ...args) => {
    return new Promise((resolve, reject) => {
        // With method 'run' we get lastID, with 'all' we get rows
        let method = sql.toLowerCase().startsWith('select') ? 'all':'run';
        db[method](sql, args, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            if (method === 'run')
                resolve(this.lastID);
            else
                resolve(rows);
        });
    });
}

const dbGetFirst = (sql, ...args) => {
    return new Promise((resolve, reject) => {
        db.get(sql, args, (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(row);
        });
    });
}


const addUser = ({username, hash}) => {
    const time = new Date().toISOString();
    const sql = 'INSERT INTO Users' +
                '(username, hash, regtime, lasttime) VALUES ' +
                '(?, ?, ?, ?)';
    return dbAll(sql, username, hash, time, time);
}

const getUser = username => {
    return dbGetFirst('SELECT * FROM Users WHERE username = ?', username);
}

const getUserItems = username => {
    
    return dbAll('SELECT id, media_url, title, description, link, time ' +
                'FROM Items WHERE username = ? ORDER BY id DESC', username);
}

// TODO: test error case
const deleteItem = ({id, username}) => {
    if (!id || !username)
        return;
    debug('DELETE FROM Items WHERE id='+id,'AND username='+username);
    return dbAll('DELETE FROM Items WHERE id=? AND username=?', id, username);
}

// TODO: better error handling
const addItem = ({username, media_url, title, description, link}) => {
        if (username && media_url && title) {
                description = description || " ";
                const currentTime = new Date();
                //const time = currentTime.toISOString();
                const sql = 'INSERT INTO Items' +
                  '(username, media_url, title, description, link, time) VALUES ' +
                  '(?, ?, ?, ?, ?, ?)';
            debug(sql, username, media_url, title,
                description.substring(0, 20)+'...', link, currentTime);
            return dbAll(sql, username, media_url, title, description, link, currentTime);
        }
        return;
}

const getExtFeeds = username => {
    return dbAll('SELECT * FROM ExtFeeds WHERE username=?', username);
}

const deleteExtFeed = ({id, username}) => {
    if (id && user) {
        debug('DELETE FROM ExtFeeds WHERE id='+id+' AND username='+username);
        return dbAll('DELETE FROM ExtFeeds WHERE id=? AND username=?', id, username);
    }
    return;
}

const addExtFeed = ({username, url, title}) => {
    if (username && url && title) {
        const sql = 'INSERT INTO ExtFeeds' +
                '(username, url, title) VALUES ' +
                '(?, ?, ?)';
        debug(sql, username, url, title);
        return dbAll(sql, username, url, title);
    }
    return;
}

const getExtFeed = id => {
    return dbAll('SELECT * FROM ExtFeeds WHERE id = ?', id);
}

module.exports = {
    addUser,
    addItem,
    getUser,
    getUserItems,
    deleteItem,
    getExtFeeds,
    deleteExtFeed,
    addExtFeed,
    getExtFeed
};
