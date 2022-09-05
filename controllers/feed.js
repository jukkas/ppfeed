const htmlToText = require('html-to-text');
const { getUserItems, addItem, deleteItem } = require('../services/db');
const { constructPodcastRss } = require('../services/podcast-rss');


const personalItems = async (req, res, username) => {

    const items = await getUserItems({ username });
    // Convert description from HTML to text (for UI tooltips)
    items.forEach(item => {
        if (item.description.includes('<') && item.description.includes('>'))
            item.description = htmlToText.fromString(item.description);
    });
    res.render('items', {
        title: 'Personal feed for ' + username,
        items: items
    });
};

const podcastRss = async function (req, res, username) {

    const defaultCount = 20;
    let limit = parseInt(req.query.count) || defaultCount;   // By default return first 20 items/episodes
    if ('all' in req.query) { // 'all' query parameter -> return all items/episodes
        limit = 0;
    }

    const items = await getUserItems({ username, limit });

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.render('xml', constructPodcastRss(items, username, req.headers.host));

}

function isURL(str) {
    var urlRegex = '^(?:(?:http|https)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
    var url = new RegExp(urlRegex, 'i');
    return str.length < 2083 && url.test(str);
}

const itemAdd = async function (req, res) {
    const username = req.session.username;
    let { url, title, link, description } = req.body;
    if (!url || !title || !isURL(url)) {
        // TODO: error reporting to user
        console.log("Invalid parameters");
        return res.redirect('../');
    }
    if (link && !isURL(link)) link = null;

    await addItem({
        username,
        media_url: url,
        title,
        description,
        link
    });

    res.redirect('../' + username);
}

const itemDelete = async function (req, res, itemId) {
    await deleteItem({ id: itemId, username: req.session.username });
    res.redirect('../../' + req.session.username);
}

module.exports = {
    personalItems,
    podcastRss,
    itemAdd,
    itemDelete
}