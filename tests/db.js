/* Database service module tests */

const test = require('tape');
const {
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
} = require('../services/db');


const username = 'testuser';
const hash = 'foooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooobar';

const testItem = {
    username,
    media_url: 'http://example.com/file.mp3',
    title: 'test title',
    description: 'test description',
    link:'http://example.com/hello.html'
};

const extFeed = {
    url: 'https://example.com/foo.xml',
    title: 'Test ext feed title'
};

test('Create user', async function(t) {
    await addUser({username, hash});
    t.pass('No errors creating user');

    const userInDb = await getUser(username);
    t.equal(userInDb.username, username, 'Username found in DB'); 
    t.equal(userInDb.hash, hash, 'Hash found in DB'); 
    t.end();
});

let testItemId;

test('Add item', async function(t) {
    await addItem(testItem);
    t.pass('No errors adding item');

    const items = await getUserItems({username});
    t.equal(items[0].title, testItem.title, 'item and title found from database');
    t.equal(items[0].media_url, testItem.media_url, 'item and media_url found from database');
    testItemId = items[0].id;
    t.end();
});

test('Delete item', async function(t) {
    await deleteItem({id: testItemId, username: username});
    t.pass('No errors deleting item');

    const items = await getUserItems({username});
    t.equal(items.length, 0, 'Item not found from database');
    t.end();
});

test('Add ext feed', async function(t) {
    await addExtFeed({username, ...extFeed});
    t.pass('No errors adding ext feed');
    t.end();
});

let extFeedId;

test('Get ext feed(s)', async function(t) {
    const feeds = await getExtFeeds(username);
    t.pass('No errors getting ext feeds');

    t.equal(feeds[0].url, extFeed.url, 'Ext feed url found from database');
    t.equal(feeds[0].title, extFeed.title, 'Ext feed title found from database');
    extFeedId = feeds[0].id;
    const feed = await(getExtFeed(extFeedId));
    t.equal(feed[0].url, extFeed.url, 'Ext feed found from database with id');

    t.end();
});

test('Delete ext feed', async function(t) {
    await deleteExtFeed({id: extFeedId, username})
    t.pass('No errors deleting ext feed');

    const feeds = await getExtFeeds(username);
    t.equal(feeds.length, 0, 'Ext feed not found from database');
    t.end();
});

test('Delete user', async function(t) {
    await deleteUser(username)
    t.pass('No errors deleting user');

    const userInDb = await getUser(username);
    t.equal(userInDb, undefined, 'Username no more found in DB')
    t.end();
});
