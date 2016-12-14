/**
 * Logging tests
 */
(function () {

    'use strict';

    var request     = require('supertest'),
        chai        = require('chai'),
        things      = require('chai-things'),
        hostparty   = require('../lib/party'),
        hooks       = require('./tests-setup'),
        expect      = chai.expect;

    chai.use(things);

    console.log(hooks);

    /**
     * Customers tests
     *
     * @return {[type]}   [description]
     */
    describe('Hosts file CRUD operations:', function() {

        /**
         * sets options
         */
        hostparty.setup({

            // set the path manually. overrides the host mapping.
            path: hooks.path//'./tests/etc/hosts.test'
        });

        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Should return all entries in the test hosts file as a dictionary object.', function (done) {

            hostparty
                .list()
                .then(function(hosts) {
                    expect(hosts).to.be.an('object');
                    done();
                })
                .catch(done);
        });


        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Add a new entry for IP 1.2.3.4 with 2 host names.', function (done) {

            hostparty
                .add('1.2.3.4', ['dog.foo', 'cats.things'])
                .then(function() {
                    done();
                })
                .catch(done);
        });


        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Add a new entry for IPv6 2001:0db8:85a3:0000:0000:8a2e:0370:7334 with 2 host names.', function (done) {

            hostparty
                .add('2001:0db8:85a3:0000:0000:8a2e:0370:7334', ['ipv6.test.com'])
                .then(function() {
                    done();
                })
                .catch(function(e) {
                    done(e);
                });
        });


        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Add bad IP and fail.', function (done) {

            hostparty
                .add('x1.2.d3.a4', ['irrelevant.com'])
                .then(function() {
                    done(new Error('Failed to trap error'));
                })
                .catch(function(){
                    done();
                });
        });


        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Removes a host name [dogs.woof].', function (done) {

            hostparty
                .purge('dogs.woof')
                .then(function() {
                    done();
                })
                .catch(done);
        });


        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Removes an IP address [8.8.4.4] and all mapped hosts.', function (done) {

            hostparty
                .remove('8.8.4.4')
                .then(function() {
                    done();
                })
                .catch(function(e) {
                    done(new Error(e));
                });
        });


        /**
         * remove protected
         *
         * tries to delete a known protected ip. expected to fail.
         */
        it('Attempt to remove a protected IP address [::1] and be rejected.', function (done) {

            hostparty
                .remove('::1')
                .then(function() {
                    done(new Error('Failed to trap error'));
                })
                .catch(function(){
                    done();
                });
        });


        /**
         * remove protected
         *
         * tries to delete a known protected ip. expected to fail.
         */
        it('Attempt to disable an IP address [1.2.3.4] and be rejected.', function (done) {

            hostparty
                .disable('10.20.30.40')
                .then(function() {
                    done();
                })
                .catch(function(e) {
                    done(new Error(e));
                });
        });
    });
}());
