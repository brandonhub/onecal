module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/*.js']
      }
    },
  });

  grunt.loadNpmTasks('grunt-mocha-test');

  // Default task(s).
  grunt.registerTask('test', ['mochaTest']);

};