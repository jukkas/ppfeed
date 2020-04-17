const debug = require('debug')('ppfeed')
const { Client } = require('pg')

const connectionString = process.env.POSTGRESQL_URI;

const client = new Client({
    connectionString: connectionString,
});
client.connect();
client.on('error', err => {
    console.error('Postgresql client connection error', err.stack);
});


const addUser = ({ username, hash }) => {
    const sql = 'INSERT INTO "ppfeed.users"' +
        '(username, hash) VALUES ' +
        '($1, $2) RETURNING regtime';
    return client.query(sql, [username, hash]);
    //.catch(e => console.error(e.stack));
}

const deleteUser = username => {
    let sql = 'DELETE FROM "ppfeed.users" WHERE username=$1';
    return client.query(sql, [username])
}

const getUser = (username) => {
    let sql = 'SELECT * FROM "ppfeed.users" WHERE username=$1';
    return client.query(sql, [username])
        .then(retval => {
            return retval.rows[0];
        });
}

const getUserItems = ({ username, limit }) => {
    let sql = 'SELECT id, media_url, title, description, link, time ' +
        'FROM "ppfeed.items" WHERE username = $1 ORDER BY id DESC';
    let sqlParams = [username];
    if (limit) {
        sql += ' LIMIT $2';
        sqlParams.push(limit);
    }
    return client.query(sql, sqlParams)
        .then(retval => {
            return retval.rows;
        });
}

// TODO: test error case
const deleteItem = ({ id, username }) => {
    if (!id || !username)
        return;
    debug('DELETE FROM "ppfeed.items" WHERE id=' + id, 'AND username=' + username);
    const sql = 'DELETE FROM "ppfeed.items" WHERE id=$1 AND username=$2';
    return client.query(sql, [id, username]);
}

// TODO: better error handling
const addItem = ({ username, media_url, title, description, link }) => {
    if (username && media_url && title) {
        description = description || " ";
        const currentTime = new Date();
        //const time = currentTime.toISOString();
        const sql = 'INSERT INTO "ppfeed.items"' +
            '(username, media_url, title, description, link, time) VALUES ' +
            '($1, $2, $3, $4, $5, $6)';
        debug(sql, username, media_url, title,
            description.substring(0, 20) + '...', link, currentTime);
        return client.query(sql, [username, media_url, title, description, link, currentTime]);
    }
    return;
}

const getExtFeeds = username => {
    return client.query('SELECT * FROM "ppfeed.extfeeds" WHERE username=$1', [username])
        .then(retval => {
            return retval.rows;
        });
}

const deleteExtFeed = ({ id, username }) => {
    if (id && username) {
        debug('DELETE FROM "ppfeed.extfeeds" WHERE id=' + id + ' AND username=' + username);
        return client.query('DELETE FROM "ppfeed.extfeeds" WHERE id=$1 AND username=$2', [id, username]);
    }
    return;
}

const addExtFeed = ({ username, url, title }) => {
    if (username && url && title) {
        const sql = 'INSERT INTO "ppfeed.extfeeds"' +
            '(username, url, title) VALUES ' +
            '($1, $2, $3)';
        debug(sql, username, url, title);
        return client.query(sql, [username, url, title]);
    }
    return;
}

const getExtFeed = id => {
    return client.query('SELECT * FROM "ppfeed.extfeeds" WHERE id = $1', [id])
        .then(retval => {
            return retval.rows;
        });
}

module.exports = {
    addUser,
    deleteUser,
    addItem,
    getUser,
    getUserItems,
    deleteItem,
    getExtFeeds,
    deleteExtFeed,
    addExtFeed,
    getExtFeed
};
