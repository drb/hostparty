/**
 *
 *     /)
 *    (/   ___ _  _/___   _   __ _/_
 *    / )_(_) /_)_(__/_)_(_(_/ (_(__(_/_
 *                .-/              .-/
 *               (_/              (_/
 *
 * CHANGELOG
 *
 * 1.0.1        23rd Nov 2016       Original version. Abililty to add/remove hosts/ips to auto-detected hosts files.



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
 **/

(function () {

    var pkg         = require('./package.json'),
        party       = require('./lib/party'),
        _           = require('lodash'),
        util        = require('util'),
        program     = require('commander'),
        table       = require('text-table'),
        isCLI       = !module.parent;

    // test to check if the app is being invoked in cli mode, or as a library
    if (isCLI) {

        var options = {
            path: {
                flag:           '-p, --path [path]',
                description:    'Path to the host file (mutes auto detection)'
            },
            force: {
                flag:           '-f, --force',
                description:    'Ovverrides the validation. Use with caution.'
            }
        };

        /**
         * pull the version out for calls to --version
         */
        program.version(pkg.version);

        /**
         * list
         *
         * spits out the hosts file in tabular format
         */
        program
            .command('list [hostname]')
            .option(options.path.flag, options.path.description)
            .description('Outputs the hosts file with optional matching hostname')
            .action(function(hostname) {

                // gets the hosts file entries as a json blob
                party
                    .list(hostname)
                    .then(function(hosts) {

                        var o = [],
                            t;

                        // push data into array
                        _.each(hosts, function(hosts, ip) {
                            o.push([ip].concat(hosts));
                        });

                        // delimit via pipe
                        t = table(o, {hsep: ' | '});

                        process.stdout.write(util.format(t, "\n"));
                    })
                    .then(function(){
                        process.exit(0);
                    })
                    .catch(function(){
                        process.exit(-1);
                    });
            });


        /**
         * remove
         */
        program
            .command('remove [ips]')
            .option(options.path.flag, options.path.description)
            .option(options.force.flag, options.force.description)
            .description('Removes all entries for an IP address')
            .action(function(ip) {

                // removes the ip
                party
                    .remove(ip)
                    .then(function() {
                        process.stdout.write(util.format("%s removed from file%s", ip, "\n"));
                    })
                    .then(function() {
                        process.exit(0);
                    })
                    .catch(function (e) {
                        process.stdout.write(util.format("%s%s", e, "\n"));
                        process.exit(-1);
                    });
            });


        /**
         * purge
         */
        program
            .command('purge [hosts]')
            .option(options.path.flag, options.path.description)
            .description('Removes all host(s) specified')
            .action(function(hostname) {

                // removes the hostname(s) specified
                party
                    .purge(hostname)
                    .then(function() {
                        process.stdout.write(util.format("%s removed from file%s", hostname, "\n"));
                    })
                    .then(function() {
                        process.exit(0);
                    })
                    .catch(function(e) {
                        process.stdout.write(util.format("%s%s", e, "\n"));
                        process.exit(-1);
                    });
            });


        /**
         * disable
         */
        program
            .command('disable [ips]')
            .option(options.path.flag, options.path.description)
            .description('Disables an IP entry')
            .action(function(ips) {

                // removes the ip(s) specified
                party
                    .disable(ips)
                    .then(function() {
                        process.stdout.write(util.format("%s disabled in host file%s", ips, "\n"));
                    })
                    .then(function() {
                        process.exit(0);
                    })
                    .catch(function(e) {
                        process.stdout.write(util.format("%s%s", e, "\n"));
                        process.exit(-1);
                    });
            });

        // parse argv
        program.parse(process.argv);

    } else {

        // just expose the api directly
        module.exports = party;
    }

})();
