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
        },
        dryRun: {
            flag:           '--dry-run',
            description:    'Preview changes without applying them.'
        },
        noBackup: {
            flag:           '--no-backup',
            description:    'Skip automatic backup before changes.'
        }
    };

    /**
     * helper function to handle dry-run result output
     */
    const handleDryRunResult = (result, successMsg) => {
        if (result && result.dryRun) {
            process.stdout.write(util.format("%s %s%s", constants.MESSAGES.DRY_RUN_PREFIX, result.message, "\n"));
            process.stdout.write(util.format("%s%s", constants.MESSAGES.DRY_RUN_NO_CHANGES, "\n"));
        } else {
            process.stdout.write(util.format("%s%s", successMsg, "\n"));
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
        .option('--json', 'Output in JSON format')
        .option('--csv', 'Output in CSV format')
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

                    // JSON output
                    if (options.json) {
                        process.stdout.write(JSON.stringify(hosts, null, 2) + "\n");
                        return;
                    }

                    // CSV output
                    if (options.csv) {
                        process.stdout.write("ip,hostname\n");
                        _.each(hosts, (hostList, ip)=>{
                            hostList.forEach((host)=>{
                                // Escape quotes in values
                                const escapedIP = ip.includes(',') ? `"${ip}"` : ip;
                                const escapedHost = host.includes(',') ? `"${host}"` : host;
                                process.stdout.write(`${escapedIP},${escapedHost}\n`);
                            });
                        });
                        return;
                    }

                    // Default table output
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
        .option(options.dryRun.flag, options.dryRun.description)
        .option(options.noBackup.flag, options.noBackup.description)
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
                    force:  options.force,
                    dryRun: options.dryRun,
                    autoBackup: !options.noBackup
                })
                .add(ip, hosts)
                .then((result)=>{
                    handleDryRunResult(result, util.format("%s hostname(s) added to IP %s", hosts.length, ip));
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
        .option(options.dryRun.flag, options.dryRun.description)
        .option(options.noBackup.flag, options.noBackup.description)
        .description('Removes all entries for an IP address.')
        .action((ip, options)=>{

            // removes the ip
            party
                .setup({
                    path:   options.path,
                    force:  options.force,
                    dryRun: options.dryRun,
                    autoBackup: !options.noBackup
                })
                .removeIP(ip)
                .then((result)=>{
                    handleDryRunResult(result, util.format("%s removed from file", ip.join(', ')));
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
        .option(options.dryRun.flag, options.dryRun.description)
        .option(options.noBackup.flag, options.noBackup.description)
        .description('Removes hostname(s) from any IP.')
        .action((hostname, options)=>{

            // removes the hostname(s) specified
            party
                .setup({
                    path:   options.path,
                    force:  options.force,
                    dryRun: options.dryRun,
                    autoBackup: !options.noBackup
                })
                .removeHost(hostname)
                .then((result)=>{
                    handleDryRunResult(result, util.format("%s removed from file", hostname.join(', ')));
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
     * rename-host
     */
    program
        .command('rename-host [oldHost] [newHost]')
        .option(options.path.flag, options.path.description)
        .option(options.force.flag, options.force.description)
        .option(options.dryRun.flag, options.dryRun.description)
        .option(options.noBackup.flag, options.noBackup.description)
        .description('Renames a hostname while retaining its IP binding.')
        .action((oldHost, newHost, options)=>{

            // renames the hostname
            party
                .setup({
                    path:   options.path,
                    force:  options.force,
                    dryRun: options.dryRun,
                    autoBackup: !options.noBackup
                })
                .renameHost(oldHost, newHost)
                .then((result)=>{
                    handleDryRunResult(result, util.format("%s renamed to %s", oldHost, newHost));
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
     * move-hostname
     */
    program
        .command('move-hostname [hostname] [toIP]')
        .option(options.path.flag, options.path.description)
        .option(options.force.flag, options.force.description)
        .option(options.dryRun.flag, options.dryRun.description)
        .option(options.noBackup.flag, options.noBackup.description)
        .description('Moves a hostname from its current IP to a new IP.')
        .action((hostname, toIP, options)=>{

            party
                .setup({
                    path:   options.path,
                    force:  options.force,
                    dryRun: options.dryRun,
                    autoBackup: !options.noBackup
                })
                .moveHostname(hostname, toIP)
                .then((result)=>{
                    handleDryRunResult(result, util.format("%s moved to %s", hostname, toIP));
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
     * search-ip
     */
    program
        .command('search-ip [ip]')
        .option(options.path.flag, options.path.description)
        .description('Finds all hostnames mapped to a given IP address.')
        .action((ip, options)=>{

            party
                .setup({
                    path: options.path
                })
                .searchByIP(ip)
                .then((result)=>{
                    if (result) {
                        process.stdout.write(util.format("IP %s has %d hostname(s): %s%s",
                            result.ip,
                            result.hostnames.length,
                            result.hostnames.join(', '),
                            "\n"));
                    } else {
                        process.stdout.write(util.format("IP %s not found in hosts file%s", ip, "\n"));
                    }
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
     * replace-ip
     */
    program
        .command('replace-ip [fromIP] [toIP]')
        .option(options.path.flag, options.path.description)
        .option(options.force.flag, options.force.description)
        .option(options.dryRun.flag, options.dryRun.description)
        .option(options.noBackup.flag, options.noBackup.description)
        .option('--keep-source', 'Keep the source IP (copy instead of move)')
        .description('Migrates all hostnames from one IP to another.')
        .action((fromIP, toIP, options)=>{

            party
                .setup({
                    path:   options.path,
                    force:  options.force,
                    dryRun: options.dryRun,
                    autoBackup: !options.noBackup
                })
                .replaceIP(fromIP, toIP, options.keepSource)
                .then((result)=>{
                    const successMsg = options.keepSource
                        ? util.format("Hostnames copied from %s to %s", fromIP, toIP)
                        : util.format("Hostnames moved from %s to %s", fromIP, toIP);
                    handleDryRunResult(result, successMsg);
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
    program
        .command('disable [ips...]')
        .option(options.path.flag, options.path.description)
        .option(options.force.flag, options.force.description)
        .option(options.dryRun.flag, options.dryRun.description)
        .option(options.noBackup.flag, options.noBackup.description)
        .description('Disables an IP entry (comments it out).')
        .action((ips, options)=>{

            party
                .setup({
                    path:   options.path,
                    force:  options.force,
                    dryRun: options.dryRun,
                    autoBackup: !options.noBackup
                })
                .disable(ips)
                .then((result)=>{
                    handleDryRunResult(result, util.format("%s disabled in host file", ips.join(', ')));
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
     * enable an entry that was previously disabled
     */
    program
        .command('enable [ips...]')
        .option(options.path.flag, options.path.description)
        .option(options.force.flag, options.force.description)
        .option(options.dryRun.flag, options.dryRun.description)
        .option(options.noBackup.flag, options.noBackup.description)
        .description('Enables a previously disabled IP entry.')
        .action((ips, options)=>{

            party
                .setup({
                    path:   options.path,
                    force:  options.force,
                    dryRun: options.dryRun,
                    autoBackup: !options.noBackup
                })
                .enable(ips)
                .then((result)=>{
                    handleDryRunResult(result, util.format("%s enabled in host file", ips.join(', ')));
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
     * backup
     */
    program
        .command('backup')
        .option(options.path.flag, options.path.description)
        .description('Creates a backup of the hosts file.')
        .action((options)=>{

            party
                .setup({
                    path: options.path
                })
                .createBackup()
                .then((backupPath)=>{
                    process.stdout.write(util.format("Backup created: %s%s", backupPath, "\n"));
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
     * stats
     */
    program
        .command('stats')
        .option(options.path.flag, options.path.description)
        .option('--json', 'Output in JSON format')
        .description('Shows statistics about the hosts file.')
        .action((options)=>{

            party
                .setup({
                    path: options.path
                })
                .getStats()
                .then((stats)=>{
                    if (options.json) {
                        process.stdout.write(JSON.stringify(stats, null, 2) + "\n");
                    } else {
                        process.stdout.write(util.format("Hosts File Statistics%s", "\n"));
                        process.stdout.write(util.format("=====================%s", "\n"));
                        process.stdout.write(util.format("Active IPs:       %d%s", stats.activeIPs, "\n"));
                        process.stdout.write(util.format("Disabled IPs:     %d%s", stats.disabledIPs, "\n"));
                        process.stdout.write(util.format("Total IPs:        %d%s", stats.totalIPs, "\n"));
                        process.stdout.write(util.format("Total hostnames:  %d%s", stats.totalHostnames, "\n"));
                        process.stdout.write(util.format("Unique hostnames: %d%s", stats.uniqueHostnames, "\n"));
                    }
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
     * list-backups
     */
    program
        .command('list-backups')
        .description('Lists available backup files.')
        .action(()=>{

            party
                .listBackups()
                .then((backups)=>{
                    if (!backups.length) {
                        process.stdout.write(util.format("%s%s", constants.MESSAGES.NO_BACKUPS_FOUND, "\n"));
                    } else {
                        process.stdout.write(util.format("Found %d backup(s):%s", backups.length, "\n"));
                        backups.forEach((backup)=>{
                            process.stdout.write(util.format("  %s%s", backup.filename, "\n"));
                        });
                    }
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
     * restore
     */
    program
        .command('restore [filename]')
        .option(options.path.flag, options.path.description)
        .description('Restores the hosts file from a backup.')
        .action((filename, options)=>{

            // If filename is provided, construct the full path
            let backupPath = null;
            if (filename) {
                const path = require('path');
                const utils = require('../lib/utils');
                backupPath = path.join(utils.getBackupDir(), filename);
            }

            party
                .setup({
                    path: options.path
                })
                .restore(backupPath)
                .then((restored)=>{
                    process.stdout.write(util.format("Restored from backup: %s%s", restored, "\n"));
                })
                .then(()=>{
                    process.exit(0);
                })
                .catch((e)=>{
                    process.stdout.write(util.format("%s%s", e, "\n"));
                    process.exit(-1);
                });
        });

    // parse argv
    program.parse(process.argv);

    // nothing supplied! show help
    if (program.args.length === 0) {
        program.help();
    }

})();
