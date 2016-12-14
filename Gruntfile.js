(function () {

    'use strict';

    module.exports = function(grunt) {

        var _           = require('lodash'),
            util        = require('util'),
            promise     = require('bluebird'),
            path        = require('path'),

            // promisifyAll the fs module...
            fs          = promise.promisifyAll(require('fs'));

        grunt.initConfig({

            // apply jslinting to the following
            jshint: {

                all: ['*.js', 'lib/**/*.js', 'tests/**/*.js'],
                options: {
                    // change the reporter to one that outputs nicely
                    reporter: require('jshint-stylish'),
                    // all rules come from .jshintrc
                    jshintrc: true
                }
            },

            // tasks that are run when grunt is in under `watch` mode
            watch: {

                // watch js files for changes
                scripts: {
                    files: ['*.js', 'lib/*.js', 'routes/**/*.js', 'tests/**/*.js', 'tests/etc/hosts.test.orig'],
                    tasks: ['jshint', 'simplemocha']
                }
            },

            // setup mocha
            simplemocha: {
                options: {
                    globals:        ['expect'],
                    timeout:        10000,
                    ignoreLeaks:    false,
                    useColors:      false,
                    fullTrace:      true,
                    ui:             'bdd',
                    reporter:       'spec'
                },
                // all tests
                all: {
                    src: [

                        // do environment tests first
                        'tests/**/*.js'
                    ]
                }
            }
        });

        // mocha
        grunt.loadNpmTasks('grunt-simple-mocha');
        grunt.loadNpmTasks('grunt-contrib-jshint');
        grunt.loadNpmTasks('grunt-contrib-watch');

        // dev will start a watcher
        grunt.registerTask('dev', [
            'watch'
        ]);

        // dev will compile the RAML and start a watcher
        grunt.registerTask('test', 'simplemocha');
    };

}());
