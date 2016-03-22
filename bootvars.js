var fs = require('fs');
var crypto = require('crypto');
var db = require('./db');

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 3000;
var dataDir = process.env.OPENSHIFT_DATA_DIR || '.';
var sessionSecret = 'uninitialised session secret';
var sessionDataFile = dataDir + '/session.dat'; 
var admins = [];

console.log('@@@@At bootvars.js: sessionSecret=',sessionSecret);

if (fs.existsSync(sessionDataFile)) {
    sessionSecret = fs.readFileSync(sessionDataFile, 'utf8');
    console.log('Read sessionSecret:',sessionSecret);
} else {
    sessionSecret = crypto.randomBytes(32).toString('base64');
    console.log('New sessionSecret:',sessionSecret);
    fs.writeFileSync(sessionDataFile, sessionSecret, 'utf8');
}

// Start reading admins
db.getAdmins(function(err, result) {
    if (result) {
        for (var i=0; i < result.length; i++) {
            var admin = result[i].username;
            admins.push(admin);
        }
    }
    console.log('bootvars.admins:',admins);
});

exports.PORT = port;
exports.DATADIR = dataDir;
exports.SESSIONSECRET = sessionSecret;
exports.admins = admins;
