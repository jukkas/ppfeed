const bcrypt = require('bcrypt');
const saltRounds = 10;

const { getUser, addUser } = require('../services/db');

// Middlewares
const ensureLoggedIn = (req, res, next) => {
    if (req.session.username) {
        next();
    } else {
        res.redirect('../');
    }
};

const ensurePersonal = (req, res, next) => {
    // Logged in user may only access their own page
    if (req.params.username === req.session.username) {
        next();
    } else {
        res.redirect('../');
    }
};


const logout = (req, res) => {
    delete req.session.username;
    req.session = null;
    res.cookie('SES');
    res.redirect('../');
}

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.redirect('../');
    }

    const user = await getUser(username);
    if (!user) {
        console.log("Unknown username", username);
        return logout(req, res);
    }

    bcrypt.compare(password, user.hash, (err, matches) => {
        if (!matches) {
            console.log('Login failure: incorrect password for', username);
            return logout(req, res);
        }
        req.session.username = username;
        res.redirect('../' + username);
    });
};

const register = (req, res) => {

    let { username, password } = req.body;
    username = username ? username.trim() : null;

    if (!username || !password || password.length < 2 || username.length < 1 ||
        !username.match(/^[0-9a-z]+$/) ||
        ['login', 'logout', 'register', 'items', 'extfeeds', 'admin', 'null', 'undefined'].includes(username)) {
        console.log('Invalid registration data');
        res.redirect('register.html');
    }

    bcrypt.hash(password, saltRounds, function (err, hash) {
        addUser({ username: username, hash })
            .then(() => {
                console.log('New user:', username);
                req.session.username = username;
                res.redirect(`../${username}`);
            })
            .catch(err => {
                console.log('Error registering new user', username, err);
                return res.redirect('register.html');
            })
    });
};


module.exports = {
    ensureLoggedIn,
    ensurePersonal,
    login,
    logout,
    register
};