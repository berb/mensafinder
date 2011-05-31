var http = require('http');
var path = require("path");
var fs = require("fs");

var Cache = require(path.join(__dirname, "cache"));
var Channel = require(path.join(__dirname, "channel"));

/**
 * Main service implementation. In-memory only and no user auth!
 * 
 * @author Benjamin Erb
 */
module.exports = (function(){

	var HEADERS = {
		'Content-Type' : 'application/json',
		'Server' : 'mensafinder/0.1.0' 
	};
	
	var readme = null;
	
	fs.readFile(path.join(__dirname, "..","..","api","mensafinder.html"), function (err, data) {
		  if (!err){
			readme = data;  
		  } 
		});

	var cache = Cache(1000*60*5);
	var channel = Channel();

	//Returns a snapshot array of all current users. 
	var getSnapshot = function(){
		var entries = cache.getAll();
		var result = [];
		var i;
		for(i = 0;i<entries.length;i++){
			result.push({
				user : entries[i].key(),
				age : Math.floor(entries[i].age() / 1000),
				orientation : entries[i].value()
			});
		}
		return result;		
	};
	
	var setPosition = function(user, orientation){
		cache.put(user,orientation);
		channel.appendMessage({
			"update" : {
				"user" : user,
				"orientation" : orientation,
			}
		});
	};
	
	var removePosition = function(user){
		if(cache.get(user) !== null){
			cache.remove(user);
			channel.appendMessage({
				"logout" : {
					"user" : user
				}
			});
		}
	};
	
	
	var handleSnapshot = function(req, res){
		res.writeHead(200, HEADERS);
		var result = {
				"time" : new Date(),
				"list" : getSnapshot()
		};
		res.end(JSON.stringify(result));
	};
	
	var handleStream = function(req, res){
		res.writeHead(200, HEADERS);
		res.write("");
		var id = channel.addClient(res);
		req.once('close', function(){
			channel.removeClient(id);
		});		
		
	};
	
	var handleUpdate = function(req, res, user, orientation){
		setPosition(user, parseInt(orientation));
		res.writeHead(202, HEADERS);
		res.end();
	};

	var handleLogout = function(req, res, user){
		removePosition(user);
		res.writeHead(204, HEADERS);
		res.end();
	};
	

	return {
		handle : function(req, res) {
			var url = req.url;
			
			var streamPath = '/orientations/stream';
			var snapshotPath = '/orientations/snapshot';			
			var update = /^\/user\/([a-zA-z0-9]{4,12})\/orientation\/(\d{1,3})$/;
			var remove = /^\/user\/([a-zA-z0-9]{4,12})\/orientation$/;
			
			if(url === streamPath && req.method === 'GET'){
				handleStream(req,res);
			}
			else if(url === snapshotPath && req.method === 'GET'){
				handleSnapshot(req,res);
			}
			else if(update.test(url) && req.method === 'PUT'){
				var result = update.exec(url);
				handleUpdate(req,res, result[1], (result[2]%360));
				
			}			
			else if(remove.test(url) && req.method === 'DELETE'){
				var result = remove.exec(url);
				handleLogout(req,res, result[1]);				
			}
			else if(url === "/" && req.method === 'GET'){
				res.writeHead(200, {
					'Content-Type' : 'text/html',
					'Server' : 'mensafinder/0.1.0' 
				});
				res.end(readme);				
			}
			else{
				res.writeHead(404, HEADERS);
				res.end('{"error":"not found"}');
			}
		}
	}
}());