var hostparty = (function (extend) {

    "use strict";

    var _           = require('lodash'),
        os          = require('os'),
        util        = require('util'),
        promise     = require('bluebird'),
        utils       = require('./utils'),
        pkg         = require('../package.json'),
        fs          = promise.promisifyAll(require('fs')),
        options     = {
            // path to file on OS
            path: './tests/etc/hosts.test'
        },


        /**
         * setup
         *
         * default options
         */
        setup = function (setup) {

            return new promise(function (resolve, reject) {

                //
                options = _.extend({

                    // path to file on OS
                    //path: './tests/etc/hosts.test'

                    //
                }, setup);

                resolve();
            });
        },


        /**
         * [add description]
         *
         * @method add
         *
         * @param  {[type]} ip        [description]
         * @param  {[type]} hostNames [description]
         */
        add = function (ip, hostNames) {

            ip = ip.trim();

            return new promise(function (resolve, reject) {

                if (!utils.validateIP(ip)) {
                    return reject('Invalid IP address was supplied.');
                }

                loadHosts()
                    .then(function(hosts) {

                        var row = hosts[ip];

                        if (row) {

                            if (!row.length) {
                               row = _.isArray(hostNames) ? hostNames : [hostNames];
                            } else {
                               row = row.concat(hostNames);
                            }

                            hosts[ip] = row;
                        }

                        // sort the dictionary of entries
                        return utils.sortEntries(hosts);
                    })
                    .then(function(hosts) {

                        return saveToFile(hosts).then(resolve);
                    })
                    .catch(reject);
            });
        },


        /**
         * remove
         *
         * removes a line by ip address
         *
         * @return {[type]} [description]
         */
        remove = function (ip) {

            return new promise(function (resolve, reject) {

                loadHosts()
                    .then(function(hosts) {

                        if (hosts[ip]) {
                            delete hosts[ip];
                        }

                        return hosts;
                    })
                    .then(function(hosts) {

                        return saveToFile(hosts).then(resolve);
                    })
                    .catch(reject);
            });
        },



        /**
         * purge
         *
         * removes hosts from an ip mapping
         *
         * @return {[type]} [description]
         */
        purge = function (hostName) {

            return new promise(function (resolve, reject) {

                loadHosts()
                    .then(function(hosts) {

                        _.each(hosts, function (hostList, ip) {

                            _.remove(hostList, function(host) {
                                return host.toLowerCase().trim() === hostName.toLowerCase().trim();
                            });
                        });

                        return hosts;
                    })
                    .then(function(hosts) {

                        return saveToFile(hosts).then(resolve);
                    })
                    .catch(reject);
            });
        },



        /**
         * [list description]
         *
         * @method list
         *
         * @return {[type]} [description]
         */
        list = function (filter) {

            return loadHosts(filter);
        },



        /**
         * [getHostFilePath description]
         *
         * @method getHostFilePath
         *
         * @return {[type]}        [description]
         */
        getHostFilePath = function () {

            return fs.realpathAsync(options.path);
        },




        /**
         * loadHosts
         *
         * @method loadHosts
         *
         * @return object of entries in the host file
         */
        loadHosts = function (filter) {

            return getHostFilePath()
                .then(function(path) {

                    return fs
                    .readFileAsync(path)
                    .then(function(file) {

                        let hosts = {
                            // comments: []
                        };

                        file.toString().split("\n").map(function(line) {

                            // comments are ignored
                            if (line.indexOf('#') === 0) {
                                // hosts.comments.push("@todo");
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

                                    hosts[line[0]] = _.uniq(ip);
                                }
                            }
                        });

                        return hosts;
                    })
                    // format the ips
                    .then(function(hosts) {

                        return utils.sortEntries(hosts);
                    });
                })
                .catch(function(e) {
                    console.error(e);
                });

        },



        /**
         * saveToFile
         *
         *
         */
        saveToFile = function (hosts) {

            return new promise(function(resolve, reject) {

                getHostFilePath()
                    .then(function(path) {

                        let contents = [
                            util.format('#'),
                            util.format('#\tHostparty version %s (%s)', pkg.version, pkg.repository),
                            util.format('#\tGenerated at %s.', new Date()),
                            util.format('#'),
                            util.format('')
                        ];

                        _.each(hosts, function(hosts, ip) {
                            contents.push(util.format('%s %s', ip, hosts.join(' ')));
                        });

                        return fs
                            .writeFileAsync(path, contents.join("\n"))
                            .then(resolve)
                            .catch(reject);

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

module.exports = hostparty;
