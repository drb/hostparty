/**
 * logging tests
 */
(()=>{

    'use strict';

    var request     = require('supertest'),
        chai        = require('chai'),
        hostparty   = require('../lib/party'),
        utils       = require('../lib/utils'),
        constants   = require('../lib/constants'),
        hooks       = require('./tests-setup'),
        expect      = chai.expect;


    /**
     * hosts file tests
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
                            expect(hosts[ip][0]).to.equal('cats.things');
                            expect(hosts[ip][1]).to.equal('dogs.foo');
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
                            expect(hosts[ip][0]).to.equal('dogs.foo');
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
                            expect(hosts[ipv6][0]).to.equal('ipv6.test.com');
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

    /**
     * smart argument detection tests
     */
    describe('Smart argument detection:', () => {

        it('Should detect when hostname and IP are swapped', (done) => {
            const result = utils.detectArgumentSwap('example.com', '192.168.1.100');
            expect(result.shouldSwap).to.be.true;
            expect(result.suggestion).to.include('192.168.1.100 example.com');
            expect(result.correctedIP).to.equal('192.168.1.100');
            expect(result.correctedHost).to.equal('example.com');
            done();
        });

        it('Should not suggest swap when IP is first', (done) => {
            const result = utils.detectArgumentSwap('192.168.1.100', 'example.com');
            expect(result.shouldSwap).to.be.false;
            done();
        });

        it('Should not suggest swap with invalid IP', (done) => {
            const result = utils.detectArgumentSwap('example.com', 'not-an-ip');
            expect(result.shouldSwap).to.be.false;
            done();
        });

        it('Should not suggest swap with invalid hostname', (done) => {
            const result = utils.detectArgumentSwap('invalid_host!', '192.168.1.100');
            expect(result.shouldSwap).to.be.false;
            done();
        });
    });

    /**
     * validation function tests
     */
    describe('Validation functions:', () => {

        it('Should validate IPv4 addresses correctly', (done) => {
            expect(utils.validateIP('192.168.1.1')).to.be.true;
            expect(utils.validateIP('127.0.0.1')).to.be.true;
            expect(utils.validateIP('0.0.0.0')).to.be.true;
            expect(utils.validateIP('255.255.255.255')).to.be.true;
            done();
        });

        it('Should validate IPv6 addresses correctly', (done) => {
            expect(utils.validateIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).to.be.true;
            expect(utils.validateIP('2001:db8::1')).to.be.true;
            expect(utils.validateIP('fe80::1')).to.be.true;
            // note: ::1 and scope identifiers like %lo0 are not supported by is-ip library
            done();
        });

        it('Should reject invalid IP addresses', (done) => {
            expect(utils.validateIP('256.1.1.1')).to.be.false;
            expect(utils.validateIP('192.168.1')).to.be.false;
            expect(utils.validateIP('not-an-ip')).to.be.false;
            expect(utils.validateIP('192.168.1.1.1')).to.be.false;
            expect(utils.validateIP('')).to.be.false;
            done();
        });

        it('Should validate hostnames correctly', (done) => {
            expect(utils.validateHost('example.com')).to.be.true;
            expect(utils.validateHost('sub.example.com')).to.be.true;
            expect(utils.validateHost('localhost')).to.be.true;
            expect(utils.validateHost('test-host.org')).to.be.true;
            expect(utils.validateHost('123.org')).to.be.true;
            done();
        });

        it('Should reject invalid hostnames', (done) => {
            expect(utils.validateHost('')).to.be.false;
            expect(utils.validateHost('invalid_host!')).to.be.false;
            expect(utils.validateHost('.example.com')).to.be.false;
            expect(utils.validateHost('example..com')).to.be.false;
            expect(utils.validateHost('example.com.')).to.be.false;
            done();
        });
    });

    /**
     * error handling and edge case tests
     */
    describe('Error handling and edge cases:', () => {

        it('Should reject empty IP when adding', (done) => {
            hostparty
                .add('', ['example.com'])
                .then(() => {
                    done(new Error('Should have rejected empty IP'));
                })
                .catch(() => {
                    done();
                });
        });

        it('Should handle empty hostnames by filtering them out', (done) => {
            const testIP = '1.2.3.110';
            hostparty
                .add(testIP, ['', 'valid-host.com', ''])
                .then(() => {
                    return hostparty.list();
                })
                .then((hosts) => {
                    expect(hosts[testIP]).to.have.length(1);
                    expect(hosts[testIP]).to.include('valid-host.com');
                    done();
                })
                .catch(done);
        });

        it('Should reject when both IP and hostnames are empty', (done) => {
            hostparty
                .add('', ['', '', ''])
                .then(() => {
                    done(new Error('Should have rejected empty IP and hostnames'));
                })
                .catch(() => {
                    done();
                });
        });

        it('Should handle multiple hostnames for same IP', (done) => {
            const testIP = '1.2.3.100';
            hostparty
                .add(testIP, ['host1.com', 'host2.com', 'host3.com'])
                .then(() => {
                    return hostparty.list();
                })
                .then((hosts) => {
                    expect(hosts[testIP]).to.have.length(3);
                    expect(hosts[testIP]).to.include('host1.com');
                    expect(hosts[testIP]).to.include('host2.com');
                    expect(hosts[testIP]).to.include('host3.com');
                    done();
                })
                .catch(done);
        });

        it('Should handle duplicate hostnames gracefully', (done) => {
            const testIP = '1.2.3.101';
            hostparty
                .add(testIP, ['duplicate.com', 'duplicate.com', 'unique.com'])
                .then(() => {
                    return hostparty.list();
                })
                .then((hosts) => {
                    expect(hosts[testIP]).to.have.length(2);
                    expect(hosts[testIP]).to.include('duplicate.com');
                    expect(hosts[testIP]).to.include('unique.com');
                    done();
                })
                .catch(done);
        });

        it('Should reject removing non-existent IP', (done) => {
            hostparty
                .remove('99.99.99.99')
                .then(() => {
                    done(new Error('Should have rejected removing non-existent IP'));
                })
                .catch(() => {
                    done();
                });
        });

        it('Should handle purging non-existent hostname gracefully', (done) => {
            hostparty
                .purge('non-existent-host.com')
                .then(() => {
                    // should succeed even if hostname doesn't exist
                    done();
                })
                .catch(done);
        });

        it('Should handle case-insensitive hostname purging', (done) => {
            const testIP = '1.2.3.102';
            const testHost = 'CaseSensitive.com';
            
            hostparty
                .add(testIP, [testHost])
                .then(() => {
                    return hostparty.purge('casesensitive.com'); // different case
                })
                .then(() => {
                    return hostparty.list();
                })
                .then((hosts) => {
                    expect(hosts).to.not.have.property(testIP);
                    done();
                })
                .catch(done);
        });

        it('Should protect against removing multiple protected IPs', (done) => {
            hostparty
                .remove(['::1', 'fe80::1%lo0'])
                .then(() => {
                    done(new Error('Should have rejected removing protected IPs'));
                })
                .catch(() => {
                    done();
                });
        });

        it('Should handle IPv6 compressed notation', (done) => {
            const ipv6 = '2001:db8::1';
            hostparty
                .add(ipv6, ['ipv6-compressed.test'])
                .then(() => {
                    return hostparty.list();
                })
                .then((hosts) => {
                    expect(hosts).to.have.property(ipv6);
                    expect(hosts[ipv6]).to.include('ipv6-compressed.test');
                    done();
                })
                .catch(done);
        });

        it('Should validate invalid hostname formats in add', (done) => {
            hostparty
                .add('192.168.1.50', ['invalid..hostname', 'valid-host.com'])
                .then(() => {
                    done(new Error('Should have rejected invalid hostname'));
                })
                .catch(() => {
                    done();
                });
        });
    });

    /**
     * filtering and listing tests
     */
    describe('Filtering and listing:', () => {

        it('Should filter hosts by hostname pattern', (done) => {
            hostparty
                .list('com')
                .then((hosts) => {
                    expect(hosts).to.be.an('object');
                    // should find entries with '.com' in hostname
                    let foundPattern = false;
                    Object.values(hosts).forEach(hostList => {
                        hostList.forEach(host => {
                            if (host.includes('com')) {
                                foundPattern = true;
                            }
                        });
                    });
                    expect(foundPattern).to.be.true;
                    done();
                })
                .catch(done);
        });

        it('Should return empty result for non-matching filter', (done) => {
            hostparty
                .list('non-existent-pattern-xyz123')
                .then((hosts) => {
                    expect(Object.keys(hosts)).to.have.length(0);
                    done();
                })
                .catch(done);
        });
    });

    /**
     * constants integration tests
     */
    describe('Constants integration:', () => {

        it('Should have all required constant categories', (done) => {
            expect(constants).to.have.property('PROTECTED_ENTRIES');
            expect(constants).to.have.property('PLATFORMS');
            expect(constants).to.have.property('PATHS');
            expect(constants).to.have.property('ERROR_CODES');
            expect(constants).to.have.property('USER_ROLES');
            expect(constants).to.have.property('USER_RESPONSES');
            expect(constants).to.have.property('MESSAGES');
            expect(constants).to.have.property('REGEX');
            expect(constants).to.have.property('DEFAULT_OPTIONS');
            expect(constants).to.have.property('OUTPUT');
            done();
        });

        it('Should have correct protected entries', (done) => {
            expect(constants.PROTECTED_ENTRIES.IPS).to.include('::1');
            expect(constants.PROTECTED_ENTRIES.IPS).to.include('fe80::1%lo0');
            expect(constants.PROTECTED_ENTRIES.HOSTS).to.include('localhost');
            done();
        });

        it('Should have all platform constants', (done) => {
            expect(constants.PLATFORMS.LINUX).to.equal('linux');
            expect(constants.PLATFORMS.DARWIN).to.equal('darwin');
            expect(constants.PLATFORMS.WIN32).to.equal('win32');
            done();
        });
    });
})();
