const test = require('tape');
const request = require('supertest');
const cheerio = require('cheerio');

const app = require('../app');
const { deleteUser, getUserItems } = require('../db');

let loginCookie;
let  credentials = {
    uname: "testuser",
    pword: "testpass"
};
let regex = new RegExp(credentials.username);

test('Register and login tests', function(t) {
    t.test('Home page', function(assert) {
        request(app)
        .get('/')
        .expect(200)
        .end(function(err, res) {
            assert.error(err, 'No error');
            const $ = cheerio.load(res.text);
            const formAction = $('form').attr('action');
            assert.ok(formAction == '/login', 'Login form found in HTML');
            assert.end();
        });
    });

    t.test('Register', async function(assert) {
        request(app)
        .post('/register')
        .send(credentials)
        .expect(302)
        .expect('location', regex)
        .end(function(err, res) {
            assert.error(err, 'No error');
            loginCookie = res.headers['set-cookie'];
            assert.end();
        });
    });

    t.test('Login', function(assert) {
        request(app)
        .post('/login')
        .send(credentials)
        .expect(302)
        .expect('location', regex)
        .end(function(err, res) {
            assert.error(err, 'No error');
            loginCookie = res.headers['set-cookie'];
            assert.end();
        });
    });
    t.test('User feed page', function(assert) {
        request(app)
        .get(`/${credentials.uname}`)
        .set('cookie', loginCookie)
        .expect(200)
        .end(function(err, res) {
            assert.error(err, 'No error');
            assert.end();
        });
    });
});

test('Feed Items tests', function(t) {
    let itemId;
    let item = {
        url: 'http://www.example.com/foo/episode.mp3',
        title: 'Test episode',
        description: 'This is the first episode description',
        link: 'https://x.yy'
    };

    t.test('Add first item', function(assert) {
        request(app)
        .post('/add')
        .set('cookie', loginCookie)
        .send(item)
        .expect(302)
        .expect('location', regex)
        .end(async function(err, res) {
            assert.error(err, 'No error');
            const items = await getUserItems({username: credentials.uname});
            itemId = items[0].id;
            assert.ok(items[0].media_url == item.url, 'Database contains posted item');
            assert.end();
        });
    });
    t.test('User feed page with new entry', function(assert) {
        request(app)
        .get(`/${credentials.uname}`)
        .set('cookie', loginCookie)
        .expect(200)
        .end(function(err, res) {
            assert.error(err, 'No error');
            const $ = cheerio.load(res.text);
            const title = $('.episode-list tr td').first().text().trim();
            assert.ok(title == item.title, 'Item title matches')
            assert.end();
        });
    });
});

test('Rss and delete tests', function(t) {
    let itemId;
    let item = {
        url: 'http://www.example.com/foo/episode2.mp3',
        title: 'Test episode 2',
        description: 'This is the second episode description'
    };

    t.test('Add second item', function(assert) {
        request(app)
        .post('/add')
        .set('cookie', loginCookie)
        .send(item)
        .expect(302)
        .expect('location', regex)
        .end(async function(err, res) {
            assert.error(err, 'No error');
            const items = await getUserItems({username: credentials.uname});
            itemId = items[0].id;
            assert.ok(items[0].media_url == item.url, 'Database contains posted item');
            assert.end();
        });
    });
    t.test('User RSS feed page', function(assert) {
        request(app)
        .get(`/${credentials.uname}/rss`)
        .set('cookie', loginCookie)
        .expect(200)
        .end(function(err, res) {
            assert.error(err, 'No error');
            const $ = cheerio.load(res.text, {
                normalizeWhitespace: true,
                xmlMode: true
            });
            assert.ok($('item title').get().length >= 2, '2 items found')
            const title = $('item title').eq(0).text();
            assert.ok(title == item.title, 'Item title matches')

            assert.end();
        });
    });
    t.test('Delete second item', function(assert) {
        request(app)
        .post('/delete')
        .set('cookie', loginCookie)
        .send({item:itemId})
        .expect(302)
        .expect('location', regex)
        .end(async function(err, res) {
            assert.error(err, 'No error');
            const items = await getUserItems({username: credentials.uname});
            assert.ok(items.length === 1, 'Database contains just one item now');
            assert.end();
        });
    });
});

test('Extfeeds tests', function(t) {
    let feedId;
    let extfeed = {
        //url: 'https://feeds.adknit.com/app-search/cnn/apollo-11-beyond-the-moon/all/720/200/',
        url: 'http://opipc.local/testfeed.xml',
    };
    let newExtItem;

    t.test('Add extfeed', function(assert) {
        request(app)
        .post('/extfeeds')
        .set('cookie', loginCookie)
        .send(extfeed)
        .expect(302)
        .expect('location', /extfeeds/)
        .end(async function(err, res) {
            assert.error(err, 'No error');
            assert.end();
        });
    });
    t.test('List extfeeds', function(assert) {
        request(app)
        .get('/extfeeds')
        .set('cookie', loginCookie)
        .expect(200)
        .end(function(err, res) {
            assert.error(err, 'No error');
            const $ = cheerio.load(res.text);
            const form = $('table tr td form').attr('action');
            let idInFormMatch = form.match(/\/(\d+)\//);
            let idInForm =  idInFormMatch ? +idInFormMatch[1] : null;
            feedId = idInForm;

            assert.end();
        });
    });
    t.test('List added feed', function(assert) {
        request(app)
        .get(`/extfeeds/${feedId}`)
        .set('cookie', loginCookie)
        .expect(200)
        .end(async function(err, res) {
            assert.error(err, 'No error');
            const $ = cheerio.load(res.text);
            const formValue = $('table tr td form input').attr('value');
            newExtItem = formValue;
            assert.end();
        });
    });
    t.test('Add item from extfeed to personal feed', async function(assert) {
        const initialItems = await getUserItems({username: credentials.uname});
        const initialItemCount = initialItems.length;

        request(app)
        .post(`/extfeeds/${feedId}`)
        .set('cookie', loginCookie)
        .send({guid: newExtItem})
        .expect(302)
        .end(async function(err, res) {
            assert.error(err, 'No error');
            const newItems = await getUserItems({username: credentials.uname});
            const newItemCount = newItems.length;
            assert.ok(newItemCount == initialItemCount + 1, 'Database contains new item');
            assert.end();
        });
    });

});


test('Cleanup database', async function(t) {
    await deleteUser(credentials.uname);
    t.end();
});

/*
// https://cheerio.js.org/
var $ = cheerio.load(html, {
          xmlMode: true
        });
*/
/* extfeed
https://feeds.adknit.com/app-search/cnn/apollo-11-beyond-the-moon/all/720/200/
http://feeds.foxnewsradio.com/hemmertime
*/