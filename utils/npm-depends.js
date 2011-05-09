/*
	fork from https://github.com/bengourley/Node-Deployment/blob/master/Jakefile.js
	
	original author : bengourley
	github : https://github.com/bengourley/Node-Deployment
*/

var sys = require('sys');

desc('Install required npm modules');
task('default', [], function () {
	
	var args = Array.prototype.slice.call(arguments);
	console.log(args);
	// Get npm programatically and the fs module
	var npm = require('/usr/local/lib/node_modules/npm'),
			fs = require("fs");

	// Load npm
	npm.load({}, function (error) {

		if (error) {
			console.log("Cannot load npm");
			throw error;
		} else {

			// Read in and parse dependencies file
			var depends = JSON.parse(fs.readFileSync(args[0]+'/config/npm-depends.json')),

					// Count number of packages to install
					// because we're going to do it async
					// and will need to know when the last
					// one is done, set callback to decrement
					// count every time a package finishes
					toInstall = depends.length,
					afterInstall = function () {
						toInstall = toInstall - 1;
						if (toInstall === 0) {
							// Signify that the task is complete
							complete();
						}
					};

			console.log("Installing " + toInstall + " package(s) and their dependencies...");

			// Install the packages
			depends.forEach(function (d) {
				npm.commands.install([d], afterInstall);

			});

		}

	});

}, true);
