/**
 * shared resources used by the nested integration tests
 *
 * @param  {[type]} 'supertest' [description]
 * @return {[type]}             [description]
 */
 (function () {

    'use strict';

    var fs      = require('fs'),
        path    = require('path'),
        util    = require('util'),
        request = require('supertest'),
        expect  = require('chai').expect,
        config  = {
            // source data
            orig: path.resolve('./tests/etc/hosts.test.orig'),
            // path to temp file
            path: path.resolve(util.format('./tests/etc/hosts.%s.tmp', Math.floor(Math.random() * 100000)))
        };

    // executed before any tests
    before(function() {

        // copy source file
        fs.writeFileSync(config.path, fs.readFileSync(config.orig));

        // pre-api call
        it('Should load the test data from a souce file and copy into a temp directory.', function (done) {
            done();
        });
    });


    // executed before each test
    beforeEach(function(done) {
        done();
    });

    // executed after each test
    afterEach(function(done) {
        done();
    });

    // executed after all tests
    after(function(done) {

        try {
            // remove the file
            fs.unlinkSync(config.tmp);
        } catch (e) {}

        // reset config
        config = {};

        //
        done();
    });

    module.exports = config;

}());
