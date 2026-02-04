/**
 * logging tests
 */
(()=>{

    'use strict';

    var chai        = require('chai'),
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
         * sets options before each test
         */
        beforeEach(() => {
            hostparty.setup({
                // set the path manually. overrides the host mapping.
                path: hooks.path,
                // disable backups during tests
                autoBackup: false
            });
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
                    expect(hosts).to.have.property('67.89.67.89');
                    expect(hosts).to.have.property('172.16.0.1');
                    done();
                })
                .catch(done);
        });

        it('Should merge duplicate IPs from multiple lines.', (done)=>{

            hostparty
                .list()
                .then((hosts)=>{
                    // 67.89.67.89 appears on two lines with dogs.com and cats.com
                    expect(hosts['67.89.67.89']).to.include('dogs.com');
                    expect(hosts['67.89.67.89']).to.include('cats.com');
                    expect(hosts['67.89.67.89']).to.have.length(2);
                    done();
                })
                .catch(done);
        });

        it('Should ignore comment lines.', (done)=>{

            hostparty
                .list()
                .then((hosts)=>{
                    // Comments should not appear as IPs
                    const ips = Object.keys(hosts);
                    const hasCommentAsIP = ips.some(ip => ip.startsWith('#'));
                    expect(hasCommentAsIP).to.be.false;
                    done();
                })
                .catch(done);
        });

        it('Should handle tabs and multiple spaces as delimiters.', (done)=>{

            hostparty
                .list()
                .then((hosts)=>{
                    // 1.2.3.4 uses tabs, 5.5.5.5 uses multiple spaces
                    expect(hosts['1.2.3.4']).to.include('caps.lol');
                    expect(hosts['5.5.5.5']).to.include('five.five');
                    done();
                })
                .catch(done);
        });

        it('Should merge hostnames when adding to existing IP.', (done)=>{

            const existingIP = '8.8.8.8'; // already has dns.google.com, dns.google.de
            const newHost = 'new-host.google.com';

            hostparty
                .add(existingIP, [newHost])
                .then(() => {
                    return hostparty.list();
                })
                .then((hosts) => {
                    // Should have original hosts plus new one
                    expect(hosts[existingIP]).to.include('dns.google.com');
                    expect(hosts[existingIP]).to.include('dns.google.de');
                    expect(hosts[existingIP]).to.include(newHost);
                    expect(hosts[existingIP].length).to.be.at.least(3);
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
                .removeHost(host)
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
                .removeHost(host)
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
                .removeHost(removedHost)
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
                .removeIP(ip)
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
                .removeIP('::1')
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
     * setup and configuration tests
     */
    describe('Setup and configuration:', () => {

        const fs = require('fs');
        const origPath = require('path').resolve('./tests/etc/hosts.test.orig');

        beforeEach(() => {
            // Reset file to original state before each test
            fs.writeFileSync(hooks.path, fs.readFileSync(origPath));
            hostparty.setup({ path: hooks.path, force: false, autoBackup: false });
        });

        it('Should return hostparty instance for chaining', (done) => {
            const result = hostparty.setup({ force: false, autoBackup: false });
            expect(result).to.equal(hostparty);
            done();
        });

        it('Should allow chained method calls', (done) => {
            hostparty
                .setup({ path: hooks.path, force: false })
                .list()
                .then((hosts) => {
                    expect(hosts).to.be.an('object');
                    done();
                })
                .catch(done);
        });

        it('Should allow force removal of protected IP', (done) => {
            // First verify ::1 exists
            hostparty
                .list()
                .then((hosts) => {
                    expect(hosts).to.have.property('::1');
                    // Now force remove it
                    return hostparty
                        .setup({ path: hooks.path, force: true })
                        .removeIP('::1');
                })
                .then(() => {
                    return hostparty.list();
                })
                .then((hosts) => {
                    expect(hosts).to.not.have.property('::1');
                    done();
                })
                .catch(done);
        });
    });

    /**
     * error handling and edge case tests
     */
    describe('Error handling and edge cases:', () => {

        const fs = require('fs');
        const origPath = require('path').resolve('./tests/etc/hosts.test.orig');

        beforeEach(() => {
            // Reset file to original state before each test
            fs.writeFileSync(hooks.path, fs.readFileSync(origPath));
            hostparty.setup({ path: hooks.path, force: false, autoBackup: false });
        });

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
                .removeIP('99.99.99.99')
                .then(() => {
                    done(new Error('Should have rejected removing non-existent IP'));
                })
                .catch(() => {
                    done();
                });
        });

        it('Should handle purging non-existent hostname gracefully', (done) => {
            hostparty
                .removeHost('non-existent-host.com')
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
                    return hostparty.removeHost('casesensitive.com'); // different case
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
                .removeIP(['::1', 'fe80::1%lo0'])
                .then(() => {
                    done(new Error('Should have rejected removing protected IPs'));
                })
                .catch(() => {
                    done();
                });
        });

        it('Should protect against removing protected hostnames', (done) => {
            hostparty
                .removeHost('localhost')
                .then(() => {
                    done(new Error('Should have rejected removing protected hostname'));
                })
                .catch((err) => {
                    expect(err).to.include('protected hostname');
                    done();
                });
        });

        it('Should protect against removing 127.0.0.1', (done) => {
            hostparty
                .removeIP('127.0.0.1')
                .then(() => {
                    done(new Error('Should have rejected removing 127.0.0.1'));
                })
                .catch((err) => {
                    expect(err).to.include('protected');
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
     * filtering and listing tests - uses fresh copy of test data
     */
    describe('Filtering and listing:', () => {

        const fs = require('fs');
        const fsPromises = require('fs').promises;
        const origPath = require('path').resolve('./tests/etc/hosts.test.orig');

        beforeEach(async () => {
            // Reset file to original state before each test (async to ensure flush)
            const content = await fsPromises.readFile(origPath);
            await fsPromises.writeFile(hooks.path, content);
            hostparty.setup({ path: hooks.path, autoBackup: false });
        });

        it('Should filter hosts by hostname pattern', (done) => {
            hostparty
                .list('com')
                .then((hosts) => {
                    expect(hosts).to.be.an('object');
                    const allHosts = Object.values(hosts).flat();
                    const hasComHosts = allHosts.some(host => host.includes('com'));
                    expect(hasComHosts).to.be.true;
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
            // Protected IPs
            expect(constants.PROTECTED_ENTRIES.IPS).to.include('127.0.0.1');
            expect(constants.PROTECTED_ENTRIES.IPS).to.include('::1');
            expect(constants.PROTECTED_ENTRIES.IPS).to.include('fe80::1%lo0');
            expect(constants.PROTECTED_ENTRIES.IPS).to.include('255.255.255.255');
            // Protected hostnames
            expect(constants.PROTECTED_ENTRIES.HOSTS).to.include('localhost');
            expect(constants.PROTECTED_ENTRIES.HOSTS).to.include('broadcasthost');
            done();
        });

        it('Should have all platform constants', (done) => {
            expect(constants.PLATFORMS.LINUX).to.equal('linux');
            expect(constants.PLATFORMS.DARWIN).to.equal('darwin');
            expect(constants.PLATFORMS.WIN32).to.equal('win32');
            done();
        });
    });

    /**
     * disable/enable tests
     */
    describe('Disable and enable operations:', () => {

        const fs = require('fs');
        const origPath = require('path').resolve('./tests/etc/hosts.test.orig');

        beforeEach(() => {
            fs.writeFileSync(hooks.path, fs.readFileSync(origPath));
            hostparty.setup({ path: hooks.path, force: false, autoBackup: false });
        });

        it('Should disable an IP entry', (done) => {
            const testIP = '10.20.30.40';

            hostparty
                .disable(testIP)
                .then(() => {
                    return hostparty.list();
                })
                .then((hosts) => {
                    expect(hosts).to.not.have.property(testIP);
                    expect(hosts).to.have.property('# ' + testIP);
                    done();
                })
                .catch(done);
        });

        it('Should enable a previously disabled IP entry', (done) => {
            const testIP = '10.20.30.40';

            hostparty
                .disable(testIP)
                .then(() => {
                    return hostparty.enable(testIP);
                })
                .then(() => {
                    return hostparty.list();
                })
                .then((hosts) => {
                    expect(hosts).to.have.property(testIP);
                    expect(hosts).to.not.have.property('# ' + testIP);
                    done();
                })
                .catch(done);
        });

        it('Should reject disabling non-existent IP', (done) => {
            hostparty
                .disable('99.99.99.99')
                .then(() => {
                    done(new Error('Should have rejected non-existent IP'));
                })
                .catch(() => {
                    done();
                });
        });

        it('Should reject enabling non-disabled IP', (done) => {
            hostparty
                .enable('10.20.30.40')
                .then(() => {
                    done(new Error('Should have rejected non-disabled IP'));
                })
                .catch(() => {
                    done();
                });
        });
    });

    /**
     * search-ip tests
     */
    describe('Search by IP operations:', () => {

        const fs = require('fs');
        const origPath = require('path').resolve('./tests/etc/hosts.test.orig');

        beforeEach(() => {
            fs.writeFileSync(hooks.path, fs.readFileSync(origPath));
            hostparty.setup({ path: hooks.path, autoBackup: false });
        });

        it('Should find hostnames for existing IP', (done) => {
            hostparty
                .searchByIP('8.8.8.8')
                .then((result) => {
                    expect(result).to.not.be.null;
                    expect(result.ip).to.equal('8.8.8.8');
                    expect(result.hostnames).to.be.an('array');
                    expect(result.hostnames.length).to.be.at.least(1);
                    done();
                })
                .catch(done);
        });

        it('Should return null for non-existent IP', (done) => {
            hostparty
                .searchByIP('99.99.99.99')
                .then((result) => {
                    expect(result).to.be.null;
                    done();
                })
                .catch(done);
        });

        it('Should reject invalid IP format', (done) => {
            hostparty
                .searchByIP('not-an-ip')
                .then(() => {
                    done(new Error('Should have rejected invalid IP'));
                })
                .catch(() => {
                    done();
                });
        });
    });

    /**
     * replace-ip tests
     */
    describe('Replace IP operations:', () => {

        const fs = require('fs');
        const origPath = require('path').resolve('./tests/etc/hosts.test.orig');

        beforeEach(() => {
            fs.writeFileSync(hooks.path, fs.readFileSync(origPath));
            hostparty.setup({ path: hooks.path, force: false, autoBackup: false });
        });

        it('Should move hostnames from one IP to another', (done) => {
            const fromIP = '10.20.30.40';
            const toIP = '10.20.30.50';

            hostparty
                .list()
                .then((hosts) => {
                    expect(hosts).to.have.property(fromIP);
                    return hostparty.replaceIP(fromIP, toIP);
                })
                .then(() => {
                    return hostparty.list();
                })
                .then((hosts) => {
                    expect(hosts).to.not.have.property(fromIP);
                    expect(hosts).to.have.property(toIP);
                    done();
                })
                .catch(done);
        });

        it('Should copy hostnames when --keep-source is used', (done) => {
            const fromIP = '10.20.30.40';
            const toIP = '10.20.30.50';

            hostparty
                .replaceIP(fromIP, toIP, true) // keepSource = true
                .then(() => {
                    return hostparty.list();
                })
                .then((hosts) => {
                    expect(hosts).to.have.property(fromIP);
                    expect(hosts).to.have.property(toIP);
                    done();
                })
                .catch(done);
        });

        it('Should reject when source IP does not exist', (done) => {
            hostparty
                .replaceIP('99.99.99.99', '10.20.30.50')
                .then(() => {
                    done(new Error('Should have rejected non-existent source IP'));
                })
                .catch(() => {
                    done();
                });
        });

        it('Should reject when source and destination are the same', (done) => {
            hostparty
                .replaceIP('10.20.30.40', '10.20.30.40')
                .then(() => {
                    done(new Error('Should have rejected same source and destination'));
                })
                .catch(() => {
                    done();
                });
        });
    });

    /**
     * dry-run tests
     */
    describe('Dry-run mode:', () => {

        const fs = require('fs');
        const origPath = require('path').resolve('./tests/etc/hosts.test.orig');

        beforeEach(() => {
            fs.writeFileSync(hooks.path, fs.readFileSync(origPath));
        });

        it('Should return dry-run result without modifying file', (done) => {
            const testIP = '99.99.99.99';
            const testHost = 'dryrun.test.com';

            hostparty
                .setup({ path: hooks.path, dryRun: true, autoBackup: false })
                .add(testIP, [testHost])
                .then((result) => {
                    expect(result).to.have.property('dryRun', true);
                    expect(result).to.have.property('message');
                    expect(result).to.have.property('preview');
                    expect(result.preview).to.include(testIP);
                    expect(result.preview).to.include(testHost);
                    // Verify file was NOT modified
                    return hostparty
                        .setup({ path: hooks.path, dryRun: false, autoBackup: false })
                        .list();
                })
                .then((hosts) => {
                    expect(hosts).to.not.have.property(testIP);
                    done();
                })
                .catch(done);
        });

        it('Should work with removeIP in dry-run mode', (done) => {
            hostparty
                .setup({ path: hooks.path, dryRun: true, autoBackup: false })
                .removeIP('10.20.30.40')
                .then((result) => {
                    expect(result).to.have.property('dryRun', true);
                    expect(result.preview).to.not.include('10.20.30.40');
                    done();
                })
                .catch(done);
        });
    });

    /**
     * backup/restore tests
     */
    describe('Backup and restore operations:', () => {

        const fs = require('fs');
        const path = require('path');
        const origPath = path.resolve('./tests/etc/hosts.test.orig');

        beforeEach(() => {
            fs.writeFileSync(hooks.path, fs.readFileSync(origPath));
            hostparty.setup({ path: hooks.path, autoBackup: false, dryRun: false });
        });

        it('Should create a backup file', (done) => {
            hostparty
                .createBackup()
                .then((backupPath) => {
                    expect(backupPath).to.be.a('string');
                    expect(backupPath).to.include('hosts.backup.');
                    // Clean up
                    return fs.promises.unlink(backupPath);
                })
                .then(() => done())
                .catch(done);
        });

        it('Should list backup files', (done) => {
            hostparty
                .createBackup()
                .then(() => {
                    return hostparty.listBackups();
                })
                .then((backups) => {
                    expect(backups).to.be.an('array');
                    expect(backups.length).to.be.at.least(1);
                    expect(backups[0]).to.have.property('filename');
                    expect(backups[0]).to.have.property('path');
                    // Clean up
                    return Promise.all(backups.map(b => fs.promises.unlink(b.path).catch(() => {})));
                })
                .then(() => done())
                .catch(done);
        });

        it('Should restore from backup', (done) => {
            let backupPath;
            const testIP = '88.88.88.88';  // Use a unique IP

            // Setup once - make sure we're using the test file
            hostparty.setup({ path: hooks.path, autoBackup: false });

            // Create backup of current state
            hostparty
                .createBackup()
                .then((bkPath) => {
                    backupPath = bkPath;
                    // Add a new IP
                    return hostparty.add(testIP, ['restore-test.local']);
                })
                .then(() => {
                    return hostparty.list();
                })
                .then((hosts) => {
                    // Verify the IP was added
                    expect(hosts).to.have.property(testIP);
                    // Now restore from backup
                    return hostparty.restore(backupPath);
                })
                .then(() => {
                    return hostparty.list();
                })
                .then((hosts) => {
                    // Verify the IP is no longer present (restored to pre-add state)
                    expect(hosts).to.not.have.property(testIP);
                    // Clean up backup file
                    return fs.promises.unlink(backupPath);
                })
                .then(() => done())
                .catch(done);
        });
    });

    /**
     * move-hostname tests
     */
    describe('Move hostname operations:', () => {

        const fs = require('fs');
        const origPath = require('path').resolve('./tests/etc/hosts.test.orig');

        beforeEach(() => {
            fs.writeFileSync(hooks.path, fs.readFileSync(origPath));
            hostparty.setup({ path: hooks.path, force: false, autoBackup: false });
        });

        it('Should move a hostname to a new IP', (done) => {
            const hostname = 'caps.lol';
            const fromIP = '1.2.3.4';
            const toIP = '99.99.99.99';

            hostparty
                .list()
                .then((hosts) => {
                    expect(hosts[fromIP]).to.include(hostname);
                    return hostparty.moveHostname(hostname, toIP);
                })
                .then(() => {
                    return hostparty.list();
                })
                .then((hosts) => {
                    expect(hosts[fromIP]).to.not.include(hostname);
                    expect(hosts[toIP]).to.include(hostname);
                    done();
                })
                .catch(done);
        });

        it('Should reject moving non-existent hostname', (done) => {
            hostparty
                .moveHostname('nonexistent.hostname', '1.2.3.4')
                .then(() => {
                    done(new Error('Should have rejected non-existent hostname'));
                })
                .catch(() => {
                    done();
                });
        });

        it('Should reject moving to same IP', (done) => {
            hostparty
                .moveHostname('caps.lol', '1.2.3.4')
                .then(() => {
                    done(new Error('Should have rejected same IP'));
                })
                .catch((err) => {
                    expect(err).to.include('already at IP');
                    done();
                });
        });
    });

    /**
     * stats tests
     */
    describe('Statistics operations:', () => {

        const fs = require('fs');
        const origPath = require('path').resolve('./tests/etc/hosts.test.orig');

        beforeEach(() => {
            fs.writeFileSync(hooks.path, fs.readFileSync(origPath));
            hostparty.setup({ path: hooks.path, autoBackup: false });
        });

        it('Should return stats object with correct properties', (done) => {
            hostparty
                .getStats()
                .then((stats) => {
                    expect(stats).to.have.property('activeIPs');
                    expect(stats).to.have.property('disabledIPs');
                    expect(stats).to.have.property('totalIPs');
                    expect(stats).to.have.property('totalHostnames');
                    expect(stats).to.have.property('uniqueHostnames');
                    expect(stats.activeIPs).to.be.a('number');
                    expect(stats.totalIPs).to.equal(stats.activeIPs + stats.disabledIPs);
                    done();
                })
                .catch(done);
        });

        it('Should count disabled IPs correctly', (done) => {
            hostparty
                .disable('10.20.30.40')
                .then(() => {
                    return hostparty.getStats();
                })
                .then((stats) => {
                    expect(stats.disabledIPs).to.equal(1);
                    done();
                })
                .catch(done);
        });
    });
})();
