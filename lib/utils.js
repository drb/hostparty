var utils = (function() {

    "use strict";

    var _ = require('lodash');

    return {

        /**
         * sorts the host file entries by ip, and all hosts alphabetically
         *
         * the hosts are also normalised
         */
        sortEntries: function (hosts) {

            // sort by ip key, alphabetically
            var keys        = _.sortBy(_.keys(hosts), function(a) {
                    // sort by first deciaml part of IP
                    return +a.split('.')[0];
                }),
                newHostMap  = {};


            // sort the hostnames array alphabetically
            _.each(keys, function(k) {

                // sort the hosts, then normalise them to lowercase
                newHostMap[k] = _.sortBy(hosts[k], function(a) { return a.toLowerCase().trim(); }).map(function(host) {
                    return host.toLowerCase().trim();
                });
            });

            return newHostMap;
        }
    };

})();

module.exports = utils;
