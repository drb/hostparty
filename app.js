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
 * 1.0.1 / 23rd Nov 2016 / Original version. Abililty to add/remove hosts/ips to auto-detected hosts files.
 * 1.0.2 / 14 Dec 2016 / Release ready
 * 1.0.4 / 22 Dec 2016 / Better tests
 **/

(()=>{

    var party = require('./lib/party');

    // just expose the api directly
    module.exports = party;

})();
