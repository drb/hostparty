/**
 * shared resources used by the nested integration tests
 *
 * @param  {[type]} 'supertest' [description]
 * @return {[type]}             [description]
 */
 (()=>{

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
    before(()=>{

        // copy source file
        fs.writeFileSync(config.path, fs.readFileSync(config.orig));

        // pre-api call
        it('Should load the test data from a known source file and copy into a temp directory to do operations on.', (done)=>{
            done();
        });
    });


    // executed before each test
    beforeEach((done)=>{
        done();
    });

    // executed after each test
    afterEach((done)=>{
        done();
    });

    // executed after all tests
    after(()=>{

        // remove the file
        fs  .unlinkAsync(config.path)
            .then(()=>{
                // console.log("Cleanup done");
            })
            .catch((e)=>{
                // console.log("Cleanup failed", e);
            })
            .finally(()=>{
                // reset config
                config = {};
            });
    });

    module.exports = config;

})();
