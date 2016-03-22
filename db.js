var fs = require("fs");
var file = "ppfeed.db";
var exists = fs.existsSync(file);

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);


var getAdmins = function(callback) {
   db.all('SELECT username FROM Admins',
          function(err, result) {
              if (err) console.log(err);
              callback(err,result);
          });
}
exports.getAdmins = getAdmins;

db.serialize(function() {
  if(!exists) {
    db.run("CREATE TABLE Users (username TEXT NOT NULL UNIQUE," +
           "hash TEXT, salt TEXT, regtime DATETIME, lasttime DATETIME)");
    db.run("CREATE TABLE Items (id INTEGER PRIMARY KEY,username TEXT," +
           "media_url TEXT,title TEXT,description TEXT," +
           "link TEXT,time DATETIME)");
    db.run("CREATE TABLE Admins (username TEXT)");
  }

  if (global.admins === undefined) {
    console.log('Getting admin list');
    db.all('SELECT username FROM Admins', function(err, result) {
        if (err) {
            console.log('Error: db:admins:',err);
            global.admins = [];
        } else {
            global.admins = result;
            console.log('Admins:', result);
        }
    });
  }
});

exports.getUser = function(username, callback) {
   db.all('SELECT * '+
          'FROM Users WHERE username = ?', username, callback);
}

exports.addUser = function(username, hash, salt, callback) {
    var time = new Date().toISOString();
    var sql = 'INSERT INTO Users'+
              '(username, hash, salt, regtime, lasttime) VALUES '+
              '(?, ?, ?, ?, ?)';
    console.log('@@db.addUser:',sql, username, hash, salt);
    db.run(sql, username, hash, salt, time, time, callback);
}

exports.userCount = function userCount(callback) {
   db.all('SELECT count(*) as count FROM Users',
          function(err, result) {
              if (err) {
                  console.log(err);
                  callback(0);
              } else {
				callback(result[0].count);
			  }
          });
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

exports.addAdmin = function(username, callback) {
    var sql = 'INSERT INTO Admins VALUES (?)';
    console.log('Adding new administrator:',sql, username);
    db.run(sql, username, callback);
}
