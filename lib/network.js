var network
	, net = require('net');

/**
  @name network
  @namespace network
*/
network = new (function () { 
	 /**
		@name network#isPortOpen
		@public
		@function
		@description Checks if the given port in the given host is open
		@param {Number} port number
		@param {String} host 
		@param {Function} callback Callback function -- should be in the format of function(err, result) {} 
	*/
	this.isPortOpen = function (port, host, callback) {
		var isOpen = false
			, connection
			, error;

		connection = net.createConnection(port, host, function () { 
			isOpen = true;
			connection.end();
		});

		connection.on('error', function (err) { 
			// We ignore 'ECONNREFUSED' as it simply indicates the port isn't open. Anything else is reported
			if(err.code !== 'ECONNREFUSED') {
				error = err;
			}
			// the socket emits 'close' after 'error'. No need to do anything here
		})

		connection.setTimeout(400, function () { 
			connection.end();
		});

		connection.on('close', function (had_error) { 
			callback(error, isOpen);
		});
	};

})();

module.exports = network;