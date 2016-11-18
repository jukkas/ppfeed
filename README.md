# Ppfeed - Personal Podcast Feed

This is a dump of a scratch of an old itch of mine. It is not pretty, but it
"works for me :tm:".

But in case someone is interested: Here is...

## Ppfeed
Host a podcast feed for your own personal consumption only.
Use the web-interface to add any downloadable mp3 (or ogg) audio files you wish
to consume as podcasts and point your podcatcher software ("subscribe")
to your personal RSS (XML) feed.

So, this is like a self hosted huffduffer.com. Except crappier, without nice
browser extensions and other features. But hey, you can host this yourself!

Ppfeed has an additional feature, that you can add any other podcast feed into
your collection ("External feeds"), browse their episodes and add any interesting
ones into your personal feed.

## Software environment
Ppfeed is written in Node.js (about version 6). It uses SQLite v3 as its database.

## Licence
This is free and unencumbered software released into the public domain.

## Notes
- Install with: `npm install`  Start with `npm start`
- User registration link is not visible in front page. Use `/register`
- User's (e.g. exampleuser) RSS feed is at `/exampleuser/rss`
- Reading your personal RSS feed is NOT authenticated, so anybody can see it,
if they know your username.
