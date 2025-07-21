/**
 *
 *     /)
 *    (/   ___ _  _/___   _   __ _/_
 *    / )_(_) /_)_(__/_)_(_(_/ (_(__(_/_
 *                .-/              .-/
 *               (_/              (_/
 *
 * changelog
 *
 * 1.0.1 / 23rd nov 2016 / original version. ability to add/remove hosts/ips to auto-detected hosts files.
 * 1.0.2 / 14 dec 2016 / release ready
 * 1.0.4 / 22 dec 2016 / better tests
 * 1.0.17 / 21st jul 2025 / modernised codebase: removed bluebird, added smart cli argument detection, constants extraction, comprehensive test coverage
 **/

(()=>{

    const party = require('./lib/party');

    // just expose the api directly
    module.exports = party;

})();
