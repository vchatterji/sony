var path = require("path");
var API = require(path.join(__dirname, "lib/api.js"));

//The api object
var sony = new API();

var device;

var timeout = process.argv[2];

timeout = parseInt(timeout);

var timeoutId;

if(isNaN(timeout)) {
	timeout = 0;
}

function takePicture() {
	device.actTakePicture(function(err, response) {
		if(timeout > 0) {
			timeoutId = setTimeout(takePicture, timeout);
		}
		else {
			device.stopRecMode(function(err, response) {
				process.exit();
			});
		}
	});
}

sony.discover(function(err, data) {
	if(data && data.length > 0) {
		device = data[0];
		device.startRecMode(function(err, response) {
			device.startLiveview(function(err, response) {
				takePicture();
			});
		});
	}
}, 2000);

process.on('SIGINT', function() {
	if(device) {
		if(timeoutId) {
			clearTimeout(timeoutId);
		}
		device.stopRecMode(function(err, response) {
			process.exit();
		});
	}
});

// catch the uncaught errors that weren't wrapped in a domain or try catch statement
// do not use this in modules, but only in applications, as otherwise we could have multiple of these bound
process.on('uncaughtException', function(error) {
	// handle the error safely
	console.log(error.stack);
});