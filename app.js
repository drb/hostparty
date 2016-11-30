/**
 * [fileMaps description]
 *
 * @type {Object}
 *
 *
Operating System	Version(s)	Location
Unix, Unix-like, POSIX		/etc/hosts[3]
Microsoft Windows	3.1	%WinDir%\HOSTS
95, 98, ME	%WinDir%\hosts[4]
NT, 2000, XP,[5] 2003, Vista,
2008, 7, 2012, 8, 10	%SystemRoot%\System32\drivers\etc\hosts [6]
Windows Mobile, Windows Phone		Registry key under HKEY_LOCAL_MACHINE\Comm\Tcpip\Hosts
Apple Macintosh	9 and earlier	Preferences or System folder
Mac OS X 10.0–10.1.5[7]	(Added through NetInfo or niload)
Mac OS X 10.2 and newer	/etc/hosts (a symbolic link to /private/etc/hosts)[7]


path = auto detect or, --path=/etc/hosts-test
repository, allow diffs
show history
validate dupes
order by hosts

hostparty add 10.44.55.66 foo.net balls test - add new row (or add entries to existing)
hostparty remove 10.44.55.66 - remove ip
hostparty purge foo.net - remove host<s>
hostparty list <hostname> - list file, or matching entries
hostparty hosts - lists all hosts
 */
(function () {

    var pkg         = require('./package.json'),
        party       = require('./lib/party'),
        _           = require('lodash'),
        util        = require('util'),
        program     = require('commander'),
        isCLI       = !module.parent;

    // test to check if the app is being invoked in cli mode, or as a library
    if (isCLI) {

        /**
         * pull the version out
         */
        program.version(pkg.version);

        /**
         * list
         *
         * spits out the hosts file
         */
        program
            .command('list [hostname]')
            .description('Outputs the hosts file with matching hostname')
            .action(function(hostname) {

                // gets the hosts file entries as a json blob
                party
                    .list(hostname)
                    .then(function(hosts) {
                        _.each(hosts, function(hosts, ip) {
                            // console.log(ip);
                            console.log(util.format('%s\t\t%s', ip, hosts.join(' ')));
                        });
                    })
                    .then(function(){
                        process.exit(0);
                    })
                    .catch(function(){
                        process.exit(-1);
                    });
            });

        /**
         * setup
         */
        program
            .command('setup [env...]')
            .description('run setup commands for all envs')
            .option("-s, --setup_mode       [mode]", "Which setup mode to use")
            .option("-t, --test             [test]", "Which test value to use")
            .action(function(env, options){
                var mode = options.setup_mode || "normal";
                var test = options.test || "no test";
                env = env || 'all';
                console.log('setup for %s env(s) with "%s" mode, and hosts path="%s".', env, mode, test);
            });

        // parse argv
        program.parse(process.argv);

    } else {

        // just expose the api directly
        module.exports = party;
    }

})();
