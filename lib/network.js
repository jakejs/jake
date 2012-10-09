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
		@param {String} host Defaults to null if not given
		@param {Function} callback 
	*/
	this.isPortOpen = function (port, host, callback) {
		var isOpen = false
			, conn = net.createConnection(port, host)
			, timeoutId = setTimeout(function () { onClose(); }, timeout)
			, timeout = 400;
		
		var onClose = function () {
			clearTimeout(timeoutId);
			delete conn;
			callback(isOpen, port, host);
		};

		var onOpen = function () {
			isOpen = true;
			conn.end();
		};

		conn.on('close', onClose);
		conn.on('error', function() { conn.end(); });
		conn.on('connect', onOpen);
	};

})();

module.exports = network;