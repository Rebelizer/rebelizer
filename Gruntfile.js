
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: {
      repository: {
        url:'http://github.com/Rebelizer/rebelizer'
      },
      version: '0.0.1 (Sneetches)'
    },
    dox: {
      options: {
        title: "Rebelizer API Docs"
      },
      files: {
        src: ['lib/**/*.js'],
          dest: 'doc'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: false,
        eqnull: true,
        laxcomma: 'off'
      },
      all: ['Gruntfile.js', 'index.js', 'lib/**/*.js', 'test/**/*.js']
    },
    changelog: {
      options: {
        dest: 'Changelog.md',
        prepend: true
      }
    },
    simplemocha: {
      options: {
        ignoreLeaks: true,
        reporter: 'list'
      },

      all: { src: ['test/**/*.test.js'] }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-dox');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-conventional-changelog');
  grunt.loadNpmTasks('grunt-simple-mocha');

  // Default task.
  grunt.registerTask('test', ['simplemocha']);
  grunt.registerTask('travis', ['simplemocha']);
  grunt.registerTask('default', ['jshint', 'dox', 'test']);
};
