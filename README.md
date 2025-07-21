```
      /)
    (/   ___ _  _/___   _   __ _/_
    / )_(_) /_)_(__/_)_(_(_/ (_(__(_/_ 🎉
                .-/              .-/
               (_/              (_/
```

## Cross platform CLI editor & JavaScript API for managing your hostsfile.

![NPM Stats](https://nodei.co/npm/hostparty.png?downloads=true&downloadRank=true&stars=true)

[![Build Status](https://travis-ci.org/drb/hostparty.svg)](https://travis-ci.org/drb/hostparty) [![npm version](https://badge.fury.io/js/hostparty.svg)](http://badge.fury.io/js/hostparty)

### Installing:

To use as a CLI tool, you can install hostparty globally.

`npm install -g hostparty`

Or, `require('hostparty')` in your own applications to use the API:

`npm install hostparty --save`

### API:

All API methods return promises and can be used with async/await.

```javascript
const party = require("hostparty");

// add a couple of hosts mapping to ip 127.0.0.1
await party.add("127.0.0.1", ["party-started.com", "party-pooper.com"]);

// see who we have in our hosts file
const hosts = await party.list();
// `hosts` is an object containing the ip as a key, and the hostnames(s) bound as an array
// 127.0.0.1 party-started.com party-pooper.com

// remove the party pooper from its bound ip
await party.purge("party-pooper.com");

// remove all entries pointing to ips 127.0.0.1 and 8.8.4.4
await party.remove(["127.0.0.1", "8.8.4.4"]);

// try and remove a protected IP
try {
  await party.remove("::1");
  console.log("All good");
} catch (e) {
  console.error("Error found [%s]. Try using the force flag.", e.message);
}

// set options to change the default path, and override any warnings
try {
  await party
    .setup({
      // override the path to the file
      path: "~/my-own/hosts",
      // ignores validation
      force: true,
    })
    .remove("::1");
  console.log("All good");
} catch (e) {
  console.error("Error:", e.message);
}
```

### CLI Usage:

From hostparty --help:

```
  Usage: hostparty [options] [command]


  Commands:

    list [options] [hostname]      Outputs the hosts file with optional matching hostname.
    add [options] [ip] [hosts...]  Adds a new host(s) entry for an IP address.
    remove [options] [ips...]      Removes all entries for an IP address.
    purge [options] [hosts...]     Removes all host(s) specified.

  Options:

    -p, --path          Path to file (auto-detection is enabled by default)
    -f, --force         Disable any validation on protected methods
    -ng, --no-group     Don't group by IP
    -h, --help          Output usage information
    -V, --version       Output the version number
```

### Smart Argument Detection:

hostparty now includes intelligent argument detection that helps prevent common mistakes when using the CLI `add` command.

If you accidentally swap the IP address and hostname arguments, hostparty will detect this and offer to correct it:

```bash
# If you accidentally type hostname first:
$ hostparty add example.com 192.168.1.100

# hostparty will detect the swap and prompt:
Warning: Arguments might be swapped. Did you mean: 192.168.1.100 example.com?
Use the suggested order? (y/n): y
Using corrected order.
1 hostname(s) added to IP 192.168.1.100
```

This feature works by:

- Validating that the first argument is a valid IP address
- Validating that subsequent arguments are valid hostnames
- Offering to swap them if the pattern suggests they're in the wrong order
- Only prompting when there's exactly one hostname provided

### Notes:

Some entries such as `::1` on OSX is protected from calls to `remove()` as this is a loopback address used by the operating system during the boot cycle. Purge is supported for hosts bound to the address, but a purge on `localhost` for this IP is protected unless the `--force` flag is used.

More docs coming! 🎉
