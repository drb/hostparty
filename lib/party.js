var api = ((extend)=>{

    "use strict";

    const constants = require('./constants');

    const protectedEntries = {
        ips:    constants.PROTECTED_ENTRIES.IPS,
        hosts:  constants.PROTECTED_ENTRIES.HOSTS
    };

    var _           = require('lodash'),
        os          = require('os'),
        util        = require('util'),
        path        = require('path'),
        utils       = require('./utils'),
        pkg         = require('../package.json'),
        fs          = require('fs').promises,
        options     = {

            // group hosts by ip
            group:  constants.DEFAULT_OPTIONS.GROUP_HOSTS,
            // override validation
            force:  constants.DEFAULT_OPTIONS.FORCE_CHANGES,
            // dry-run mode - preview changes without writing
            dryRun: constants.DEFAULT_OPTIONS.DRY_RUN,
            // auto-backup before changes
            autoBackup: constants.DEFAULT_OPTIONS.AUTO_BACKUP,
            // maximum number of backups to keep
            maxBackups: constants.DEFAULT_OPTIONS.MAX_BACKUPS
        },


        /**
         * setup
         *
         * default options
         */
        setup = (setup)=>{

            // Reset to defaults first, then apply new options
            options = _.extend({
                group:      constants.DEFAULT_OPTIONS.GROUP_HOSTS,
                force:      constants.DEFAULT_OPTIONS.FORCE_CHANGES,
                dryRun:     constants.DEFAULT_OPTIONS.DRY_RUN,
                autoBackup: constants.DEFAULT_OPTIONS.AUTO_BACKUP,
                maxBackups: constants.DEFAULT_OPTIONS.MAX_BACKUPS
            }, setup || {});
            //
            return api;
        },


        /**
         * adds hostname entries to an ip address
         *
         * @method add
         * @param  {string} ip        the ip address to add hostnames to
         * @param  {array} hostNames  array of hostnames to add
         * @return {promise}          resolves when complete
         */
        add = (ip, hostNames)=>{

            ip          = (ip || '').trim();
            hostNames   = _.compact(_.isArray(hostNames) ? hostNames : [hostNames]);

            return new Promise((resolve, reject)=>{

                if (!ip.length && !hostNames.length) {
                    return reject('Neither a hostname or IP was supplied.');
                }

                if (!utils.validateIP(ip)) {
                    return reject(util.format('Invalid IP address [%s] was supplied.', ip));
                }

                hostNames.forEach((host)=>{
                    if (!utils.validateHost(host)) {
                        return reject(util.format('Invalid hostname [%s] was supplied.', host));
                    }
                });

                loadHosts()
                    .then((hosts)=>{

                        let row = hosts[ip];

                        if (!row) {
                           row = hostNames;
                        } else {
                           row = row.concat(hostNames);
                        }

                        hosts[ip] = _.uniq(row);

                        return hosts;
                    })
                    .then((hosts)=>{

                        const dryRunMsg = util.format('Would add: %s -> %s', hostNames.join(', '), ip);
                        return saveToFile(hosts, dryRunMsg).then(resolve);
                    })
                    .catch(reject);
            });
        },


        /**
         * removeIP
         *
         * removes entries by ip address
         *
         * @param  {array} ips array of ip addresses to remove
         * @return {promise}   resolves when complete
         */
        removeIP = (ips)=>{

            ips = _.isArray(ips) ? ips : [ips];

            return new Promise((resolve, reject)=>{

                if (!ips.length) {
                    return reject('No IP addresses provided');
                }

                ips.forEach((ip)=>{
                    if (!utils.validateIP(ip)) {
                        return reject(util.format('Invalid IP address [%s] was supplied.', ip));
                    }
                });

                ips.forEach((ip)=>{
                    if (protectedEntries.ips.indexOf(ip) > -1) {
                        if (!options.force) {
                            return reject(util.format('%s is protected by the OS and cannot be removed. Use --force to override this.', ip));
                        }
                    }
                });

                loadHosts()
                    .then((hosts)=>{

                        ips.forEach((ip)=>{

                            if (hosts[ip]) {
                                delete hosts[ip];
                            } else {
                                return reject(util.format('IP %s not found in hosts file.', ip));
                            }
                        });

                        return hosts;
                    })
                    .then((hosts)=>{

                        const dryRunMsg = util.format('Would remove IP(s): %s', ips.join(', '));
                        return saveToFile(hosts, dryRunMsg).then(resolve);
                    })
                    .catch(reject);
            });
        },



        /**
         * disable
         *
         * disables entries by ip address (comments them out)
         *
         * @param  {array} ips array of ip addresses to disable
         * @return {promise}   resolves when complete
         */
        disable = (ips)=>{

            ips = _.isArray(ips) ? ips : [ips];

            return new Promise((resolve, reject)=>{

                if (!ips.length) {
                    return reject('No IP address provided');
                }

                ips.forEach((ip)=>{
                    if (!utils.validateIP(ip)) {
                        return reject(util.format('Invalid IP address [%s] was supplied.', ip));
                    }
                });

                ips.forEach((ip)=>{
                    if (protectedEntries.ips.indexOf(ip) > -1) {
                        if (!options.force) {
                            return reject(util.format('%s is protected by the OS and cannot be removed. Use --force to override this.', ip));
                        }
                    }
                });

                loadHosts()
                    .then((hosts)=>{

                        // console.log(hosts);

                        ips.forEach((ip)=>{

                            // console.log(hosts[ip], ip);

                            var commentBlock = util.format('# %s', ip);

                            if (hosts[ip]) {
                                hosts[commentBlock] = hosts[ip];
                                delete hosts[ip];
                            } else {
                                return reject(util.format('IP %s not in hosts file.', ip));
                            }
                        });

                        return hosts;
                    })
                    .then((hosts)=>{

                        const dryRunMsg = util.format('Would disable IP(s): %s', ips.join(', '));
                        return saveToFile(hosts, dryRunMsg).then(resolve);
                    })
                    .catch(reject);
            });
        },



        /**
         * enable
         *
         * re-enables a previously disabled entry
         *
         * @param  {array} ips array of ip addresses to enable
         * @return {promise}   resolves when complete
         */
        enable = (ips)=>{

            ips = _.isArray(ips) ? ips : [ips];

            return new Promise((resolve, reject)=>{

                if (!ips.length) {
                    return reject('No IP addresses provided');
                }

                ips.forEach((ip)=>{
                    if (!utils.validateIP(ip)) {
                        return reject(util.format('Invalid IP address [%s] was supplied.', ip));
                    }
                });

                loadHosts()
                    .then((hosts)=>{

                        ips.forEach((ip)=>{

                            var commentBlock = util.format('# %s', ip);

                            if (hosts[commentBlock]) {
                                hosts[ip] = _.clone(hosts[commentBlock]);
                                delete hosts[commentBlock];
                            } else {
                                return reject(util.format('IP %s not in file.', ip));
                            }

                            // console.log(commentBlock, hosts[commentBlock]);
                        });

                        return hosts;
                    })
                    .then((hosts)=>{

                        const dryRunMsg = util.format('Would enable IP(s): %s', ips.join(', '));
                        return saveToFile(hosts, dryRunMsg).then(resolve);
                    })
                    .catch(reject);
            });
        },



        /**
         * renameHost
         *
         * renames a hostname while retaining its IP binding
         *
         * @param  {string} oldHostName the existing hostname to rename
         * @param  {string} newHostName the new hostname
         * @return {promise}            resolves when complete
         */
        renameHost = (oldHostName, newHostName)=>{

            oldHostName = (oldHostName || '').trim().toLowerCase();
            newHostName = (newHostName || '').trim().toLowerCase();

            return new Promise((resolve, reject)=>{

                if (!oldHostName.length) {
                    return reject('No existing hostname provided.');
                }

                if (!newHostName.length) {
                    return reject('No new hostname provided.');
                }

                if (!utils.validateHost(oldHostName)) {
                    return reject(util.format('Invalid hostname [%s] was supplied.', oldHostName));
                }

                if (!utils.validateHost(newHostName)) {
                    return reject(util.format('Invalid hostname [%s] was supplied.', newHostName));
                }

                // check if old hostname is protected
                const oldIsProtected = protectedEntries.hosts.some(
                    (protectedHost) => protectedHost.toLowerCase() === oldHostName.toLowerCase()
                );
                if (oldIsProtected && !options.force) {
                    return reject(util.format('%s is a protected hostname and cannot be renamed. Use --force to override this.', oldHostName));
                }

                loadHosts()
                    .then((hosts)=>{

                        let found = false;

                        // find the IP that has the old hostname and replace it
                        _.each(hosts, (hostList, ip)=>{

                            const index = _.findIndex(hostList, (host)=>{
                                return host.toLowerCase() === oldHostName;
                            });

                            if (index > -1) {
                                found = true;
                                hostList[index] = newHostName;
                            }
                        });

                        if (!found) {
                            return reject(util.format('Hostname [%s] not found in hosts file.', oldHostName));
                        }

                        return hosts;
                    })
                    .then((hosts)=>{

                        const dryRunMsg = util.format('Would rename: %s -> %s', oldHostName, newHostName);
                        return saveToFile(hosts, dryRunMsg).then(resolve);
                    })
                    .catch(reject);
            });
        },


        /**
         * removeHost
         *
         * removes specific hostnames from all ip mappings
         *
         * @param  {array} hostNames array of hostnames to remove
         * @return {promise}         resolves when complete
         */
        removeHost = (hostNames)=>{

            hostNames = _.isArray(hostNames) ? hostNames : [hostNames];

            return new Promise((resolve, reject)=>{

                hostNames.forEach((host)=>{
                    if (!utils.validateHost(host)) {
                        return reject(util.format("Invalid host [%s] supplied", host));
                    }
                });

                // check for protected hostnames
                hostNames.forEach((host)=>{
                    const isProtected = protectedEntries.hosts.some(
                        (protectedHost) => protectedHost.toLowerCase() === host.toLowerCase()
                    );
                    if (isProtected && !options.force) {
                        return reject(util.format('%s is a protected hostname and cannot be removed. Use --force to override this.', host));
                    }
                });

                loadHosts()
                    .then((hosts)=>{

                        // loop supplied hostnames
                        _.each(hostNames, (hostName)=>{

                            // loop the hosts against the ip
                            _.each(hosts, (hostList, ip)=>{

                                // purge the matching
                                _.remove(hostList, (host)=>{
                                    return host.toLowerCase().trim() === hostName.toLowerCase().trim();
                                });

                                // if the purge leaves the ip hostnbame bindings empty, bin it off
                                if (!hostList.length) {
                                    try {
                                        delete hosts[ip];
                                    } catch (e) {}
                                }
                            });
                        });

                        return hosts;
                    })
                    .then((hosts)=>{

                        const dryRunMsg = util.format('Would remove hostname(s): %s', hostNames.join(', '));
                        return saveToFile(hosts, dryRunMsg).then(resolve);
                    })
                    .catch(reject);
            });
        },


        /**
         * moveHostname
         *
         * moves a specific hostname from its current IP to a new IP
         *
         * @method moveHostname
         * @param  {string} hostName the hostname to move
         * @param  {string} toIP     the destination IP address
         * @return {promise}         resolves when complete
         */
        moveHostname = (hostName, toIP)=>{

            hostName = (hostName || '').trim().toLowerCase();
            toIP = (toIP || '').trim();

            return new Promise((resolve, reject)=>{

                if (!hostName.length) {
                    return reject('No hostname provided.');
                }

                if (!toIP.length) {
                    return reject('No destination IP provided.');
                }

                if (!utils.validateHost(hostName)) {
                    return reject(util.format('Invalid hostname [%s] was supplied.', hostName));
                }

                if (!utils.validateIP(toIP)) {
                    return reject(util.format('Invalid destination IP [%s] was supplied.', toIP));
                }

                // Check if hostname is protected
                const isProtected = protectedEntries.hosts.some(
                    (protectedHost) => protectedHost.toLowerCase() === hostName.toLowerCase()
                );
                if (isProtected && !options.force) {
                    return reject(util.format('%s is a protected hostname and cannot be moved. Use --force to override this.', hostName));
                }

                loadHosts()
                    .then((hosts)=>{

                        let found = false;
                        let fromIP = null;

                        // Find the IP that currently has this hostname
                        _.each(hosts, (hostList, ip)=>{

                            const index = _.findIndex(hostList, (host)=>{
                                return host.toLowerCase() === hostName;
                            });

                            if (index > -1) {
                                found = true;
                                fromIP = ip;

                                // Remove from current IP
                                hostList.splice(index, 1);

                                // If this leaves the IP empty, remove it
                                if (!hostList.length) {
                                    delete hosts[ip];
                                }
                            }
                        });

                        if (!found) {
                            return reject(util.format('Hostname [%s] not found in hosts file.', hostName));
                        }

                        // Check if already at destination
                        if (fromIP === toIP) {
                            return reject(util.format('Hostname [%s] is already at IP %s.', hostName, toIP));
                        }

                        // Add to destination IP
                        if (hosts[toIP]) {
                            hosts[toIP].push(hostName);
                            hosts[toIP] = _.uniq(hosts[toIP]);
                        } else {
                            hosts[toIP] = [hostName];
                        }

                        return hosts;
                    })
                    .then((hosts)=>{

                        const dryRunMsg = util.format('Would move hostname %s to %s', hostName, toIP);
                        return saveToFile(hosts, dryRunMsg).then(resolve);
                    })
                    .catch(reject);
            });
        },


        /**
         * replaceIP
         *
         * migrates all hostnames from one IP to another
         *
         * @method replaceIP
         * @param  {string} fromIP       the source IP address
         * @param  {string} toIP         the destination IP address
         * @param  {boolean} keepSource  if true, keeps the source IP (copy mode)
         * @return {promise}             resolves when complete
         */
        replaceIP = (fromIP, toIP, keepSource = false)=>{

            fromIP = (fromIP || '').trim();
            toIP = (toIP || '').trim();

            return new Promise((resolve, reject)=>{

                if (!fromIP.length) {
                    return reject('No source IP address provided.');
                }

                if (!toIP.length) {
                    return reject('No destination IP address provided.');
                }

                if (!utils.validateIP(fromIP)) {
                    return reject(util.format('Invalid source IP address [%s] was supplied.', fromIP));
                }

                if (!utils.validateIP(toIP)) {
                    return reject(util.format('Invalid destination IP address [%s] was supplied.', toIP));
                }

                if (fromIP === toIP) {
                    return reject('Source and destination IP addresses are the same.');
                }

                // Check if source IP is protected
                if (protectedEntries.ips.indexOf(fromIP) > -1) {
                    if (!options.force) {
                        return reject(util.format('%s is protected by the OS and cannot be modified. Use --force to override this.', fromIP));
                    }
                }

                loadHosts()
                    .then((hosts)=>{

                        if (!hosts[fromIP]) {
                            return reject(util.format('Source IP %s not found in hosts file.', fromIP));
                        }

                        // Get hostnames from source
                        const sourceHosts = hosts[fromIP];

                        // Merge with destination (if it exists)
                        if (hosts[toIP]) {
                            hosts[toIP] = _.uniq(hosts[toIP].concat(sourceHosts));
                        } else {
                            hosts[toIP] = sourceHosts;
                        }

                        // Remove source unless keepSource is true
                        if (!keepSource) {
                            delete hosts[fromIP];
                        }

                        return hosts;
                    })
                    .then((hosts)=>{

                        const action = keepSource ? 'copy' : 'move';
                        const dryRunMsg = util.format('Would %s hostnames from %s to %s', action, fromIP, toIP);
                        return saveToFile(hosts, dryRunMsg).then(resolve);
                    })
                    .catch(reject);
            });
        },


        /**
         * searchByIP
         *
         * returns all hostnames mapped to a given IP address
         *
         * @method searchByIP
         * @param  {string} ip the IP address to search for
         * @return {promise}   resolves with array of hostnames or null if not found
         */
        searchByIP = (ip)=>{

            ip = (ip || '').trim();

            return new Promise((resolve, reject)=>{

                if (!ip.length) {
                    return reject('No IP address provided.');
                }

                if (!utils.validateIP(ip)) {
                    return reject(util.format('Invalid IP address [%s] was supplied.', ip));
                }

                loadHosts()
                    .then((hosts)=>{

                        if (hosts[ip]) {
                            resolve({
                                ip: ip,
                                hostnames: hosts[ip]
                            });
                        } else {
                            resolve(null);
                        }
                    })
                    .catch(reject);
            });
        },


        /**
         * list
         *
         * returns all entries in the hosts file
         *
         * @method list
         * @param  {string} filter optional filter to match hostnames
         * @return {promise}       resolves with hosts object
         */
        list = (filter)=>{

            return loadHosts(filter);
        },


        /**
         * getStats
         *
         * returns statistics about the hosts file
         *
         * @method getStats
         * @return {promise} resolves with stats object
         */
        getStats = ()=>{

            return loadHosts()
                .then((hosts)=>{

                    let activeIPs = 0;
                    let disabledIPs = 0;
                    let totalHostnames = 0;
                    let uniqueHostnames = new Set();

                    _.each(hosts, (hostList, ip)=>{

                        if (ip.startsWith('# ')) {
                            disabledIPs++;
                        } else {
                            activeIPs++;
                        }

                        totalHostnames += hostList.length;
                        hostList.forEach((h) => uniqueHostnames.add(h.toLowerCase()));
                    });

                    return {
                        activeIPs: activeIPs,
                        disabledIPs: disabledIPs,
                        totalIPs: activeIPs + disabledIPs,
                        totalHostnames: totalHostnames,
                        uniqueHostnames: uniqueHostnames.size
                    };
                });
        },


        /**
         * createBackup
         *
         * creates a backup of the hosts file
         *
         * @method createBackup
         * @return {promise} resolves with the backup file path
         */
        createBackup = ()=>{

            return new Promise((resolve, reject)=>{

                const backupDir = utils.getBackupDir();
                const backupPath = utils.generateBackupPath();

                // Ensure backup directory exists
                fs.mkdir(backupDir, { recursive: true })
                    .then(()=>{
                        return getHostFilePath();
                    })
                    .then((hostPath)=>{
                        return fs.copyFile(hostPath, backupPath);
                    })
                    .then(()=>{
                        // Prune old backups if needed
                        return pruneBackups().then(()=> resolve(backupPath));
                    })
                    .catch(reject);
            });
        },


        /**
         * listBackups
         *
         * lists all available backup files
         *
         * @method listBackups
         * @return {promise} resolves with array of backup info objects
         */
        listBackups = ()=>{

            return new Promise((resolve, reject)=>{

                const backupDir = utils.getBackupDir();

                fs.readdir(backupDir)
                    .then((files)=>{

                        const backups = files
                            .filter((f) => f.startsWith('hosts.backup.'))
                            .map((f) => ({
                                filename: f,
                                path: path.join(backupDir, f),
                                timestamp: f.replace('hosts.backup.', '').replace(/-/g, (m, i) => i < 10 ? '-' : (i < 13 ? 'T' : (i < 16 ? ':' : '.')))
                            }))
                            .sort((a, b) => b.filename.localeCompare(a.filename)); // newest first

                        resolve(backups);
                    })
                    .catch((e)=>{
                        if (e.code === 'ENOENT') {
                            resolve([]); // No backup directory yet
                        } else {
                            reject(e);
                        }
                    });
            });
        },


        /**
         * restore
         *
         * restores the hosts file from a backup
         *
         * @method restore
         * @param  {string} backupPath optional path to specific backup (defaults to latest)
         * @return {promise}           resolves with the restored backup path
         */
        restore = (backupPath)=>{

            return new Promise((resolve, reject)=>{

                const getBackup = backupPath
                    ? Promise.resolve(backupPath)
                    : listBackups().then((backups)=>{
                        if (!backups.length) {
                            return Promise.reject(constants.MESSAGES.NO_BACKUPS_FOUND);
                        }
                        return backups[0].path; // Latest backup
                    });

                getBackup
                    .then((backup)=>{
                        backupPath = backup;
                        return getHostFilePath();
                    })
                    .then((hostPath)=>{
                        return fs.copyFile(backupPath, hostPath);
                    })
                    .then(()=>{
                        resolve(backupPath);
                    })
                    .catch(reject);
            });
        },


        /**
         * pruneBackups
         *
         * removes old backups beyond the maximum limit
         *
         * @method pruneBackups
         * @return {promise} resolves with number of backups pruned
         */
        pruneBackups = ()=>{

            return new Promise((resolve, reject)=>{

                listBackups()
                    .then((backups)=>{

                        if (backups.length <= options.maxBackups) {
                            return resolve(0);
                        }

                        const toDelete = backups.slice(options.maxBackups);
                        const deletePromises = toDelete.map((b) => fs.unlink(b.path));

                        Promise.all(deletePromises)
                            .then(()=>{
                                resolve(toDelete.length);
                            })
                            .catch(reject);
                    })
                    .catch(reject);
            });
        },


        /**
         * gets the platform-specific path to the hosts file
         *
         * operating system	version(s)	 location
         * unix, unix-like, posix		 /etc/hosts
         * microsoft windows	         3.1	%windir%\hosts
         * 95, 98, me	                 %windir%\hosts
         * nt, 2000, xp,[5] 2003, vista,
         * 2008, 7, 2012, 8, 10	         %systemroot%\system32\drivers\etc\hosts
         * mac os x 10.0–10.1.5	         (added through netinfo or niload)
         * mac os x 10.2 and newer	     /etc/hosts (a symbolic link to /private/etc/hosts)
         *
         * supported architectures: 'arm', 'arm64', 'ia32', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x', 'x32', 'x64', and 'x86'
         *
         * @method getHostFilePath
         * @return {promise} resolves with the file path
         */
        getHostFilePath = ()=>{

            var filePath;

            // path was set by user via options
            if (options.path) {
                filePath = options.path;

            } else {

                // calculate the path
                switch (os.platform()) {

                    case constants.PLATFORMS.LINUX:
                    case constants.PLATFORMS.DARWIN:
                    case constants.PLATFORMS.FREEBSD:
                    case constants.PLATFORMS.OPENBSD:
                        //
                        filePath = constants.PATHS.UNIX_HOSTS;
                        break;

                    case constants.PLATFORMS.WIN32:
                        //
                        filePath = process.env.windir || process.env.WINDIR;

                        if (filePath) {
                            filePath = path.normalize(util.format('%s%s', filePath, constants.PATHS.WINDOWS_HOSTS_SUFFIX));
                        }
                        break;
                    default:
                }
            }

            // console.log('Resolved OS "%s" target path to %s', os.platform(), path);

            // now resolve it
            return fs.realpath(filePath);
        },




        /**
         * loadHosts
         *
         * @method loadHosts
         *
         * @return object of entries in the host file
         */
        loadHosts = (filter)=>{

            return getHostFilePath()
                .then((path)=>{

                    return fs
                    .readFile(path)
                    .then((file)=>{

                        let hosts = {
                                // comments: []
                            },
                            expression = /((^\#\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/;

                        file.toString().split("\n").map((line)=>{

                            // Check for disabled entries (commented IPs like "# 192.168.1.1 hostname")
                            if (line.indexOf('#') === 0) {
                                // Try to parse as disabled entry
                                const disabledMatch = line.match(/^#\s*(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+(.+)$/);
                                if (disabledMatch) {
                                    const disabledIP = '# ' + disabledMatch[1];
                                    const disabledHosts = disabledMatch[2].trim().split(/\s+/);
                                    if (hosts[disabledIP]) {
                                        hosts[disabledIP] = hosts[disabledIP].concat(disabledHosts);
                                    } else {
                                        hosts[disabledIP] = disabledHosts;
                                    }
                                }
                                return;
                            }

                            // split the string to get the ip and hosts
                            line = line .replace(/(\s)+/g, ' ')
                                        .split(' ');

                            if (!line.length || line.length < 2) {

                            } else {

                                // duplicate ip, so merge them
                                if (line[0].length) {

                                    let ip = hosts[line[0]];

                                    if (ip) {
                                        ip = ip.concat(_.compact(line.slice(1)));
                                    } else {
                                        ip = _.compact(line.slice(1));
                                    }

                                    // only return matching hosts
                                    if (filter) {

                                        var matching = _.filter(ip, (ip)=>{
                                            return ip.indexOf(filter) > -1;
                                        });

                                        if (matching.length) {
                                            ip = matching;
                                        } else {
                                            return;
                                        }
                                    }

                                    hosts[line[0]] = _.uniq(ip);
                                }
                            }
                        });

                        return hosts;
                    })
                    // format the ips
                    .then((hosts)=>{

                        return utils.sortEntries(hosts);
                    });
                })
                .catch((e)=>{
                    console.error(e);
                });

        },



        /**
         * saveToFile
         *
         * @param {object} hosts - the hosts object to save
         * @param {string} dryRunMessage - optional message describing what would change (for dry-run output)
         */
        saveToFile = (hosts, dryRunMessage)=>{

            // sort the dictionary of entries
            hosts = utils.sortEntries(hosts);

            return new Promise((resolve, reject)=>{

                getHostFilePath()
                    .then((filePath)=>{

                        let contents = [];

                        _.each(hosts, (hosts, ip)=>{

                            // group the hosts by IP
                            if (options.group) {

                                contents.push(util.format('%s %s', ip, hosts.join(' ')));
                            } else {

                                // don't group - 1 line per IP
                                hosts.forEach((host)=>{
                                    contents.push(util.format('%s %s', ip, host));
                                });
                            }
                        });

                        // Dry-run mode: return preview instead of writing
                        if (options.dryRun) {
                            return resolve({
                                dryRun: true,
                                message: dryRunMessage,
                                preview: contents.join("\n")
                            });
                        }

                        // Auto-backup before writing (if enabled)
                        const backupPromise = options.autoBackup
                            ? createBackup().catch(() => {/* Ignore backup errors */})
                            : Promise.resolve();

                        return backupPromise.then(()=>{
                            return fs
                                .writeFile(filePath, util.format("%s%s", contents.join("\n"), "\n"))
                                .then(resolve)
                                .catch((e)=>{

                                    var message     = 'Error writing file',
                                        elevated    = (os.platform().match(constants.REGEX.WINDOWS_PLATFORM) ? constants.USER_ROLES.WINDOWS_ADMIN : constants.USER_ROLES.UNIX_ROOT);

                                    // access denied?
                                    switch (e.code) {
                                        case constants.ERROR_CODES.ACCESS_DENIED:
                                            message = util.format('Write permission denied on %s. Try running as %s.', filePath, elevated);
                                            break;
                                    }

                                    reject(message);
                                });
                        });

                    }).catch(reject);
            });
        },

        /**
         * @deprecated Use removeIP() instead
         */
        remove = (...args)=>{
            console.warn('hostparty: remove() is deprecated, use removeIP() instead');
            return removeIP(...args);
        },

        /**
         * @deprecated Use removeHost() instead
         */
        purge = (...args)=>{
            console.warn('hostparty: purge() is deprecated, use removeHost() instead');
            return removeHost(...args);
        };

    return {
        setup:      setup,
        add:        add,
        removeIP:   removeIP,
        removeHost: removeHost,
        renameHost: renameHost,
        moveHostname: moveHostname,
        replaceIP:  replaceIP,
        disable:    disable,
        enable:     enable,
        searchByIP: searchByIP,
        list:       list,
        getStats:   getStats,
        createBackup: createBackup,
        listBackups: listBackups,
        restore:    restore,
        pruneBackups: pruneBackups,
        remove:     remove,
        purge:      purge
    };
})();

module.exports = api;
