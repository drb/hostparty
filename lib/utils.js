var utils = (()=>{

    "use strict";

    var _       = require('lodash'),
        isIp    = require('is-ip');

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
         * [validateIP description]
         *
         * @method validateIP
         *
         * @param  {[type]}   ip [description]
         *
         * @return {[type]}      [description]
         */
        validateIP: (ip)=>{

            // utilise the is-ip library
            return isIp(ip);
        },


        /**
         * [validateHost description]
         *
         * @method validateHost
         *
         * @param  {[type]}     hostName [description]
         *
         * @return {[type]}              [description]
         */
        validateHost: (hostName)=>{

            let regex = /^((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]))$/;

            return regex.test(hostName);
        }
    };

})();

module.exports = utils;
