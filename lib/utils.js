var utils = (()=>{

    "use strict";

    var _           = require('lodash'),
        util        = require('util'),
        { isIP }    = require('is-ip'),
        constants   = require('./constants');

    return {

        /**
         * sorts the host file entries by ip, and all hosts alphabetically
         *
         * the hosts are also normalised
         */
        sortEntries: (hosts)=>{

            // sort by ip key, alphabetically
            var keys        = _.sortBy(_.keys(hosts), (a)=>{
                    // sort by first decimal part of IP
                    return +a.replace(/\D/g, '');
                }),
                newHostMap  = {};

            // sort the hostnames array alphabetically
            _.each(keys, (k)=>{

                // sort the hosts, then normalise them to lowercase
                newHostMap[k] =
                    _.sortBy(hosts[k], (a)=>{
                        return a.toLowerCase().trim();
                    })
                    .map((host)=>{
                        return host.toLowerCase().trim();
                    });
            });

            return newHostMap;
        },

        /**
         * validates an ip address using the is-ip library
         *
         * @method validateIP
         * @param  {string} ip the ip address to validate
         * @return {boolean}   true if valid, false otherwise
         */
        validateIP: (ip)=>{

            // utilise the is-ip library
            return isIP(ip);
        },


        /**
         * validates a hostname using regex pattern matching
         *
         * @method validateHost
         * @param  {string} hostName the hostname to validate
         * @return {boolean}         true if valid, false otherwise
         */
        validateHost: (hostName)=>{

            let regex = constants.REGEX.HOSTNAME_VALIDATION;

            return regex.test(hostName);
        },

        /**
         * detects if ip and hostname arguments appear to be swapped
         * returns object with suggestion if swap is detected
         *
         * @param  {string} arg1 first argument (expected to be ip)
         * @param  {string} arg2 second argument (expected to be hostname)
         * @return {object}      object with shouldSwap boolean and suggestion text
         */
        detectArgumentSwap: (arg1, arg2) => {
            const api = module.exports;
            const isArg1IP = api.validateIP(arg1);
            const isArg1Host = api.validateHost(arg1);
            const isArg2IP = api.validateIP(arg2);
            const isArg2Host = api.validateHost(arg2);

            // If first arg looks like hostname (but not IP) and second is clearly an IP, suggest swap
            if (!isArg1IP && isArg1Host && isArg2IP) {
                return {
                    shouldSwap: true,
                    suggestion: util.format(constants.MESSAGES.SWAP_SUGGESTION_FORMAT, arg2, arg1),
                    correctedIP: arg2,
                    correctedHost: arg1
                };
            }

            return { shouldSwap: false };
        }
    };

})();

module.exports = utils;
