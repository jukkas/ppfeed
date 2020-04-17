create schema ppfeed;

CREATE TABLE "ppfeed.users" (
    username    TEXT PRIMARY KEY NOT NULL,
    hash        TEXT,
    regtime     TIMESTAMP NOT NULL DEFAULT current_timestamp,
    updatedtime TIMESTAMP
);

CREATE TABLE "ppfeed.items" (
    id SERIAL PRIMARY KEY,
    username TEXT REFERENCES "ppfeed.users"(username) ON DELETE CASCADE,
    media_url TEXT,
    title TEXT,
    description TEXT,
    link TEXT,
    time TIMESTAMP
);

CREATE TABLE "ppfeed.extfeeds" (
    id SERIAL PRIMARY KEY,
    username TEXT REFERENCES "ppfeed.users"(username) ON DELETE CASCADE,
    url TEXT,
    title TEXT
);
