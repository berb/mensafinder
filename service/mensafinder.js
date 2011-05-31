var http = require("http");
var path = require("path");

var service = require(path.join(__dirname, "lib","mensafinder-service"));
var s = http.createServer(service.handle);
s.listen(7080, "127.0.0.1");

process.on('uncaughtException', function(err) {
	console.error('[ERROR] ' + err);
});