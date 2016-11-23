/**
 * Logging tests
 */
(function () {

    'use strict';

    var request     = require('supertest'),
        chai        = require('chai'),
        things      = require('chai-things'),
        hostparty   = require('../lib/party'),
        expect      = chai.expect;

    chai.use(things);

    /**
     * Customers tests
     *
     * @return {[type]}   [description]
     */
    describe('hostsfile operations:', function() {


        const testValues = {

        };

        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Should return all entries in the test hosts file as a dictionary object.', function (done) {

            hostparty
                .list()
                .then(function(hosts) {
                    // console.log("first test");
                    // console.log(hosts);
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
                .catch(done);
        });
    });
}());
