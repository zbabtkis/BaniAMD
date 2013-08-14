module.exports = function(grunt) {
	grunt.initConfig({
		uglify: {
			bani: {
				files: {
					'bani.min.js': ['bani.js'] 
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('build', ['uglify']);
}