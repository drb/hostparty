var utils = (function() {

    "use strict";

    var _       = require('lodash'),
        isIp    = require('is-ip');

    return {


        // var windir = process.env.windir || process.env.WINDIR;
        //   if (typeof windir === 'string' && windir.length > 0) {
        //     file = windir + '\\SysWOW64\\cmd.exe';
        //   }

        // fs  .readFileAsync('/etc/hosts')
        //     .then(function(file) {
        //
        //         var hosts = {};
        //
        //         file.toString().split("\n").map(function(line) {
        //
        //             if (line.indexOf('#') === 0) {
        //                 return;
        //             }
        //
        //             line = line .replace(/(\s)+/g, ' ')
        //                         .split(' ');
        //
        //             console.log("ip % hostname %s", line[0], line[1], line);
        //         });
        //     });

        // console.log(os.arch(), fileMaps.test);

        /**
         * sorts the host file entries by ip, and all hosts alphabetically
         *
         * the hosts are also normalised
         */
        sortEntries: function (hosts) {

            // sort by ip key, alphabetically
            var keys        = _.sortBy(_.keys(hosts), function(a) {
                    // sort by first decimal part of IP
                    return +a.replace(/\D/g, '');
                }),
                newHostMap  = {};

            // sort the hostnames array alphabetically
            _.each(keys, function(k) {

                // sort the hosts, then normalise them to lowercase
                newHostMap[k] =
                    _.sortBy(hosts[k], function(a) {
                        return a.toLowerCase().trim();
                    })
                    .map(function(host) {
                        return host.toLowerCase().trim();
                    });
            });

            return newHostMap;
        },


        validateIP: function (ip) {

            return isIp(ip);
        },


        validateHost: function (hostName) {

            let regex = /^((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]))$/;
            
            return regex.test(hostName);
        }
    };

})();

module.exports = utils;
