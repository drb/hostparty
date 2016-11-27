/**
 * shared resources used by the nested integration tests
 *
 * @param  {[type]} 'supertest' [description]
 * @return {[type]}             [description]
 */
 (function () {

    'use strict';

    var request = require('supertest'),
        expect  = require('chai').expect;


    describe('hooks', function() {

        // executed before any tests
        before(function(done) {
            done();
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
            //
            done();
        });
    });

    module.exports = {};

}());
