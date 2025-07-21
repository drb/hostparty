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
            force:  constants.DEFAULT_OPTIONS.FORCE_CHANGES
        },


        /**
         * setup
         *
         * default options
         */
        setup = (setup)=>{

            options = _.extend(options, setup || {});
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

                        return saveToFile(hosts).then(resolve);
                    })
                    .catch(reject);
            });
        },


        /**
         * remove
         *
         * removes entries by ip address
         *
         * @param  {array} ips array of ip addresses to remove
         * @return {promise}   resolves when complete
         */
        remove = (ips)=>{

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

                        return saveToFile(hosts).then(resolve);
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

                        return saveToFile(hosts).then(resolve);
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
                                // delete hosts[commentBlock];
                            } else {
                                return reject(util.format('IP %s not in file.', ip));
                            }

                            // console.log(commentBlock, hosts[commentBlock]);
                        });

                        return hosts;
                    })
                    .then((hosts)=>{

                        return saveToFile(hosts).then(resolve);
                    })
                    .catch(reject);
            });
        },



        /**
         * purge
         *
         * removes specific hostnames from all ip mappings
         *
         * @param  {array} hostNames array of hostnames to remove
         * @return {promise}         resolves when complete
         */
        purge = (hostNames)=>{

            hostNames = _.isArray(hostNames) ? hostNames : [hostNames];

            return new Promise((resolve, reject)=>{

                hostNames.forEach((host)=>{
                    if (!utils.validateHost(host)) {
                        return reject(util.format("Invalid host [%s] supplied", host));
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

                        return saveToFile(hosts).then(resolve);
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

                            // comments are ignored
                            // this needs to be better
                            if (line.indexOf('#') === 0) {
                                // console.log("got comment", line.replace(/\#\ /ig, ''));
                                // if (utils.validateHost(line.replace(/\#\ /ig, ''))) {
                                //     // hosts.comments.push(line);
                                //     console.log('got disabled', line);
                                // }
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
         *
         */
        saveToFile = (hosts)=>{

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

                        //
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

                    }).catch(reject);
            });
        };

    return {
        setup:      setup,
        add:        add,
        remove:     remove,
        list:       list,
        purge:      purge
    };
})();

module.exports = api;
