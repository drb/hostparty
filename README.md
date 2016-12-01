```
      /)
    (/   ___ _  _/___   _   __ _/_
    / )_(_) /_)_(__/_)_(_(_/ (_(__(_/_ 🎉
                .-/              .-/
               (_/              (_/
```

## Programmatic and CLI editor for hosts file; Nodejs.

![NPM Stats](https://nodei.co/npm/hostparty.png?downloads=true&downloadRank=true&stars=true)

[![Build Status](https://travis-ci.org/drb/hostparty.svg)](https://travis-ci.org/drb/hostparty) [![npm version](https://badge.fury.io/js/hostparty.svg)](http://badge.fury.io/js/hostparty)

### Installing:

To use as a CLI tool, you can install hostparty globally.

`npm install -g hostparty`

Or as an API in your own apps to `require()`.

`npm install hostparty --save`

### API:

```javascript
let party = require('hostparty');

// add a couple of hosts mapping to ip 127.0.0.1
party.add('127.0.0.1', ['party-started.com', 'party-pooper.com']);

// see who we have in our hosts file
party.list().then(function(hosts) {

    // `hosts` is an object containing the ip as a key, and the value an array of hostnames
    // 127.0.0.1 party-started.com party-pooper.com
});

// remove the party pooper
party.purge('party-pooper.com');

// remove all entries pointing to ip 127.0.0.1
party.remove('127.0.0.1');

```

### CLI :

```
sudo hostparty add 127.0.0.1 party-started.com
```

### Notes:

`::1` is protected from calls to `remove()` as this is a loopback address used by some operating systems during bootup. Purge is supported for hosts bound to the address, but a purge on `localhost` for this IP is protected.

More docs coming! 🎉
