/**
 * A simple pub/sub channel using non-terminating HTTP connections
 * 
 * @author Benjamin Erb
 */
module.exports = function() {
	
	var idx = 0;
	
	var clients = [];
	
	var clientCount = 0;
	
	var _addClient = function(client){
		clients[idx] = client;
		clientCount++;
		return idx++;
	};
	
	var _removeClient = function(_idx){
		
		if(clients[_idx]){
			delete clients[_idx];
			clientCount--;
		}
	};
	
	var _appendMessage = function(msg){
		
		var dispatch = function(client){
			//be nice!
			process.nextTick(function(){
				if(client && typeof client === 'object'){
					try{
						client.write(JSON.stringify(msg));
						client.write("\r\n");
					}
					catch (e) {
						console.log(e);
					}
				}
			});
		};
		
		//no queuing, directly dispatch
		clients.forEach(function(client){
			dispatch(client);
		});
		
		console.log("idx "+idx);
		console.log("clientCount "+clientCount);
	};
	
	return {
		addClient : _addClient,
		removeClient : _removeClient,
		appendMessage : _appendMessage
	};
};