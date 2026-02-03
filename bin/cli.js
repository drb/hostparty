#!/usr/bin/env node

(()=>{

    const   pkg         = require('../package.json'),
            party       = require('../lib/party'),
            utils       = require('../lib/utils'),
            constants   = require('../lib/constants'),

            //
            _           = require('lodash'),
            util        = require('util'),
            readline    = require('readline'),
            { program } = require('commander'),
            table       = require('text-table'),
            color       = require('cli-color');
            // ansiTrim    = require('cli-color/lib/trim')

    const options = {
        path: {
            flag:           '--path [path]',
            description:    'Path to the host file (mutes auto-detection)'
        },
        force: {
            flag:           '--force',
            description:    'Overrides checks & forces changes. Use with caution.'
        },
        group: {
            flag:           '--no-group',
            description:    'One line per hostname, instead of grouping.'
        }
    };

    /**
     * helper function to prompt user for input
     */
    const promptUser = (question) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer.toLowerCase().trim());
            });
        });
    };

    /**
     * pull the version out for calls to --version
     */
    program.version(pkg.version);

    /**
     * list
     *
     * outputs the hosts file in tabular format
     */
    program
        .command('list [hostname]')
        .option(options.path.flag, options.path.description)
        .option(options.group.flag, options.group.description)
        .description('Outputs the hosts file with optional matching hostname.')
        .action((hostname, options)=>{

            // gets the hosts file entries as a json blob
            party
                .setup({
                    path:   options.path,
                    force:  options.force,
                    group:  !options.group
                })
                .list(hostname)
                .then((hosts)=>{

                    var opts = {
                            hsep: constants.OUTPUT.TABLE_SEPARATOR,
                            // stringLength: function(s) { return ansiTrim(s).length; }
                        },
                        o = [],
                        t;

                    // push data into array
                    _.each(hosts, (hosts, ip)=>{
                        if (options.group) {

                            o.push([ip].concat(hosts));
                        } else {

                            // don't group - 1 line per ip
                            hosts.forEach((host)=>{
                                o.push([ip, host]);
                            });
                        }
                    });

                    // delimit via pipe
                    t = table(o, opts);

                    process.stdout.write(util.format(t, "\n"));
                })
                .then(()=>{
                    process.exit(0);
                })
                .catch(()=>{
                    process.exit(-1);
                });
        });


    /**
     * add
     */
    program
        .command('add [ip] [hosts...]')
        .option(options.path.flag, options.path.description)
        .option(options.force.flag, options.force.description)
        .description('Adds hostname(s) to an IP address.')
        .action(async (ip, hosts, options)=>{

            // check if arguments might be swapped (only if we have exactly one host)
            if (hosts && hosts.length === 1) {
                const swapCheck = utils.detectArgumentSwap(ip, hosts[0]);
                if (swapCheck.shouldSwap) {
                    process.stdout.write(util.format("%s%s", color.yellow(`${constants.MESSAGES.ARGUMENT_SWAP_WARNING} ${swapCheck.suggestion}`), constants.OUTPUT.NEWLINE));
                    const answer = await promptUser(constants.MESSAGES.ARGUMENT_SWAP_PROMPT);
                    
                    if (answer === constants.USER_RESPONSES.YES_SHORT || answer === constants.USER_RESPONSES.YES_LONG) {
                        ip = swapCheck.correctedIP;
                        hosts = [swapCheck.correctedHost];
                        process.stdout.write(util.format("%s%s", color.green(constants.MESSAGES.ORDER_CORRECTED), constants.OUTPUT.NEWLINE));
                    }
                }
            }

            // adds the ip
            party
                .setup({
                    path:   options.path,
                    force:  options.force
                })
                .add(ip, hosts)
                .then(()=>{
                    process.stdout.write(util.format("%s hostname(s) added to IP %s%s", hosts.length, ip, "\n"));
                })
                .then(()=>{
                    process.exit(0);
                })
                .catch((e)=>{
                    process.stdout.write(util.format("%s%s", e, "\n"));
                    process.exit(-1);
                });
        });



    /**
     * remove-ip
     */
    program
        .command('remove-ip [ips...]')
        .option(options.path.flag, options.path.description)
        .option(options.force.flag, options.force.description)
        .description('Removes all entries for an IP address.')
        .action((ip, options)=>{

            // removes the ip
            party
                .setup({
                    path:   options.path,
                    force:  options.force
                })
                .removeIP(ip)
                .then(()=>{
                    process.stdout.write(util.format("%s removed from file%s", ip.join(', '), "\n"));
                })
                .then(()=>{
                    process.exit(0);
                })
                .catch((e)=>{
                    process.stdout.write(util.format("%s%s", e, "\n"));
                    process.exit(-1);
                });
        });


    /**
     * remove-host
     */
    program
        .command('remove-host [hosts...]')
        .option(options.path.flag, options.path.description)
        .option(options.force.flag, options.force.description)
        .description('Removes hostname(s) from any IP.')
        .action((hostname, options)=>{

            // removes the hostname(s) specified
            party
                .setup({
                    path:   options.path,
                    force:  options.force
                })
                .removeHost(hostname)
                .then(()=>{
                    process.stdout.write(util.format("%s removed from file%s", hostname.join(', '), "\n"));
                })
                .then(()=>{
                    process.exit(0);
                })
                .catch((e)=>{
                    process.stdout.write(util.format("%s%s", e, "\n"));
                    process.exit(-1);
                });
        });


    /**
     * disable an entry (comments it out)
     */
    // program
    //     .command('disable [ips...]')
    //     .option(options.path.flag, options.path.description)
    //     .option(options.force.flag, options.force.description)
    //     .description('Disables an IP entry.')
    //     .action(function(ips, options) {
    //
    //         // removes the ip(s) specified
    //         party
    //             .setup({
    //                 path:   options.path,
    //                 force:  options.force
    //             })
    //             .disable(ips)
    //             .then(function() {
    //                 process.stdout.write(util.format("%s disabled in host file%s", ips.join(', '), "\n"));
    //             })
    //             .then(function() {
    //                 process.exit(0);
    //             })
    //             .catch(function(e) {
    //                 process.stdout.write(util.format("%s%s", e, "\n"));
    //                 process.exit(-1);
    //             });
    //     });
    //
    //
    // /**
    //  * enable an entry that was previously disabled
    //  */
    // program
    //     .command('enable [ips...]')
    //     .option(options.path.flag, options.path.description)
    //     .option(options.force.flag, options.force.description)
    //     .description('Enables an IP entry.')
    //     .action(function(ips, options) {
    //
    //         // removes the ip(s) specified
    //         party
    //             .setup({
    //                 path:   options.path,
    //                 force:  options.force
    //             })
    //             .enable(ips)
    //             .then(function() {
    //                 process.stdout.write(util.format("%s enabled in host file%s", ips.join(', '), "\n"));
    //             })
    //             .then(function() {
    //                 process.exit(0);
    //             })
    //             .catch(function(e) {
    //                 process.stdout.write(util.format("%s%s", e, "\n"));
    //                 process.exit(-1);
    //             });
    //     });

    // parse argv
    program.parse(process.argv);

    // nothing supplied! show help
    if (program.args.length === 0) {
        program.help();
    }

})();
