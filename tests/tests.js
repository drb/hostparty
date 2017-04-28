/**
 * Logging tests
 */
(()=>{

    'use strict';

    var request     = require('supertest'),
        chai        = require('chai'),
        hostparty   = require('../lib/party'),
        hooks       = require('./tests-setup'),
        expect      = chai.expect;


    /**
     * Customers tests
     *
     * @return {[type]}   [description]
     */
    describe('Hosts file CRUD operations:', ()=>{

        /**
         * sets options
         */
        hostparty.setup({

            // set the path manually. overrides the host mapping.
            path: hooks.path
        });

        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Should return all entries in the test hosts file as a dictionary object.', (done)=>{

            hostparty
                .list()
                .then((hosts)=>{
                    expect(hosts).to.be.an('object');
                    expect(hosts).to.have.property('::1');
                    expect(hosts).to.have.property('1.2.3.4');
                    expect(hosts).to.have.property('1.2.3.5');
                    expect(hosts).to.have.property('5.5.5.5');
                    expect(hosts).to.have.property('8.8.4.4');
                    expect(hosts).to.have.property('8.8.8.8');
                    expect(hosts).to.have.property('9.8.7.6');
                    expect(hosts).to.have.property('10.5.6.7');
                    expect(hosts).to.have.property('10.20.30.40');
                    expect(hosts).to.have.property('45.6.7.8');
                    done();
                })
                .catch(done);
        });


        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Add a new entry for IP 1.1.2.2 with 2 host names.', (done)=>{

            let ip = '1.1.2.3';

            hostparty
                .add(ip, ['dogs.foo', 'cats.things'])
                .then(()=>{

                    hostparty
                        .list()
                        .then((hosts)=>{
                            expect(hosts).to.be.an('object');
                            expect(hosts).to.have.property(ip);
                            expect(hosts[ip]).to.have.length(2);
                            expect(hosts[ip]).to.have.deep.property('[0]', 'cats.things');
                            expect(hosts[ip]).to.have.deep.property('[1]', 'dogs.foo');
                            done();
                        })
                        .catch(done);
                })
                .catch(done);
        });


        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Remove hostname entry from 1.1.2.2.', (done)=>{

            let ip = '1.1.2.3',
                host = 'cats.things';

            hostparty
                .purge(host)
                .then(()=>{

                    hostparty
                        .list()
                        .then((hosts)=>{
                            expect(hosts).to.be.an('object');
                            expect(hosts).to.have.property(ip);
                            expect(hosts[ip]).to.have.length(1);
                            expect(hosts[ip]).to.have.deep.property('[0]', 'dogs.foo');
                            done();
                        })
                        .catch(done);
                })
                .catch(done);
        });



        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Remove another hostname entry from 1.1.2.2, removing the IP entirely', (done)=>{

            let ip = '1.1.2.3',
                host = 'dogs.foo';

            hostparty
                .purge(host)
                .then(()=>{

                    hostparty
                        .list()
                        .then((hosts)=>{
                            expect(hosts).to.be.an('object');
                            expect(hosts).to.not.have.property(ip);
                            done();
                        })
                        .catch(done);
                })
                .catch(done);
        });


        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Add a new entry for IPv6 2001:0db8:85a3:0000:0000:8a2e:0370:7334 with 2 host names.', (done)=>{

            let ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

            hostparty
                .add(ipv6, ['ipv6.test.com'])
                .then(()=>{

                    hostparty
                        .list()
                        .then((hosts)=>{
                            expect(hosts).to.be.an('object');
                            expect(hosts).to.have.property(ipv6);
                            expect(hosts[ipv6]).to.have.length(1);
                            expect(hosts[ipv6]).to.have.deep.property('[0]', 'ipv6.test.com');
                            done();
                        })
                        .catch(done);
                })
                .catch((e)=>{
                    done(e);
                });
        });


        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Add bad IP and fail.', (done)=>{

            let badIp = 'x1.2.d3.a4';

            hostparty
                .add(badIp, ['irrelevant.com'])
                .then(()=>{
                    done(new Error('Failed to trap error'));
                })
                .catch(()=>{

                    hostparty
                        .list()
                        .then((hosts)=>{
                            expect(hosts).to.be.an('object');
                            expect(hosts).to.not.have.property(badIp);
                            done();
                        })
                        .catch(done);
                });
        });


        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Removes a host name [foo.net].', (done)=>{

            let removedHost = 'foo.net';

            hostparty
                .purge(removedHost)
                .then(()=>{

                    hostparty
                        .list()
                        .then((hosts)=>{
                            expect(hosts).to.be.an('object');
                            expect(hosts['10.5.6.7']).to.not.include(removedHost);
                            done();
                        })
                        .catch(done);
                })
                .catch(done);
        });


        /**
         * log types
         *
         * get types of log that are filterable
         */
        it('Removes an IP address [8.8.4.4] and all mapped hosts.', (done)=>{

            let ip = '8.8.4.4';

            hostparty
                .remove(ip)
                .then(()=>{

                    hostparty
                        .list()
                        .then((hosts)=>{
                            expect(hosts).to.be.an('object');
                            expect(hosts).to.not.have.property(ip);
                            done();
                        })
                        .catch(done);
                })
                .catch((e)=>{
                    done(new Error(e));
                });
        });


        /**
         * remove protected
         *
         * tries to delete a known protected ip. expected to fail.
         */
        it('Attempt to remove a protected IP address [::1] and be rejected.', (done)=>{

            hostparty
                .remove('::1')
                .then(()=>{
                    done(new Error('Failed to trap error'));
                })
                .catch(()=>{
                    done();
                });
        });


        /**
         * remove protected
         *
         * tries to delete a known protected ip. expected to fail.
         */
        // it('Attempt to disable an IP address [10.20.30.40].', function (done) {
        //
        //     let disabledIP = '10.20.30.40';
        //
        //     hostparty
        //         .disable(disabledIP)
        //         .then(function() {
        //
        //             hostparty
        //                 .list()
        //                 .then(function(hosts) {
        //                     expect(hosts).to.be.an('object');
        //                     expect(hosts).to.not.have.property(disabledIP);
        //                     done();
        //                 })
        //                 .catch(done);
        //         })
        //         .catch(function(e) {
        //             done(new Error(e));
        //         });
        // });


        /**
         * remove protected
         *
         * tries to delete a known protected ip. expected to fail.
         */
        // it('Attempt to enable a previously disabled IP address [10.20.30.40].', function (done) {
        //
        //     let enabledIP = '10.20.30.40';
        //
        //     hostparty
        //         .enable(enabledIP)
        //         .then(function() {
        //
        //             hostparty
        //                 .list()
        //                 .then(function(hosts) {
        //                     expect(hosts).to.be.an('object');
        //                     expect(hosts).to.have.property(enabledIP);
        //                     done();
        //                 })
        //                 .catch(done);
        //         })
        //         .catch(function(e) {
        //             done(new Error(e));
        //         });
        // });
    });
})();
