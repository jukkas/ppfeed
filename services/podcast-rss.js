const format = require('date-fns/format');

const constructPodcastRss = (items, username, host) => {
    const channelLink = 'http://' + (host || 'localhost'); // TODO: https/https from config
    const channelImage = channelLink + '/ppfeed.png'; //TODO: from config

    // Add stuff to items
    for (item of items) {
        if (item.media_url.endsWith('.ogg') ||
            item.media_url.endsWith('.oga') ||
            item.media_url.indexOf('.ogg?') != -1 ||
            item.media_url.indexOf('.oga?') != -1) {
            item.media_url_type = 'audio/ogg';
        } else {
            item.media_url_type = 'audio/mpeg';
        }

        item.pubDate = format(new Date(item.time), 'EEE, d MMM yyyy HH:mm:ss XX');
        item.guid = item.media_url.replace('&','_');
    }
    const rss = {
        channelTitle: `Personal Podcast Feed for ${username}`,
        channelLink,
        channelImage,
        items
    }

    return rss;
}

module.exports = {
    constructPodcastRss
};