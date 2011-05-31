/**
 * A cache object that provides auto-removal of expiring entries.
 * 
 * @author Benjamin Erb
 */
module.exports = function(expireTime) {

	/*
	 * Wrapper object for cache entries. Immutable
	 */
	var Entry = function(k, v, expireCallback) {
		var time = new Date().getTime();
		var timeoutId = setTimeout(expireCallback, expireTime);

		// Helper method for removing entries before expiring.
		var _purge = function() {
			clearTimeout(timeoutId);
		};

		// Helper method for returning the age of an entry in milliseconds.
		var _age = function() {
			return (new Date().getTime() - time);
		};

		return {
			value : function() {
				return v;
			},
			key : function() {
				return k;
			},
			purge : _purge,
			age : _age
		};
	};

	var cache = {};

	var size = 0;

	// Return an entry or null
	var _get = function(k) {
		if (cache.hasOwnProperty(k)) {
			return cache[k];
		}
		else {
			return null;
		}
	};
	

	//Removes an entry. This includes purge(), which unregisters the timeout
	var _remove = function(k) {
		if (cache.hasOwnProperty(k)) {
			cache[k].purge();
			delete cache[k];
			size--;
		}
	};

	//Remove all entries
	var _clear = function() {
		var k;
		for (k in cache) {
			if (cache.hasOwnProperty(k)) {
				_remove(k);
			}
		}
	};	

	// Add a new entry
	var _put = function(k, v) {
		if (k !== null && v !== null) {
			// Remove existing entry
			if (cache.hasOwnProperty(k)) {
				_remove(k);
			}

			cache[k] = Entry(k, v, function() {
				_remove(k);
			});
			size++;
		}
	};

	// Return a snapshot array of all entries. 
	var _getAll = function() {
		var entries = [];
		var k;
		for (k in cache) {
			if (cache.hasOwnProperty(k)) {
				entries.push(cache[k]);
			}
		}
		return entries;
	};
	
	// Return a snapshot array of all keys.  
	var _keySet = function() {
		var entries = [];
		var k;
		for (k in cache) {
			if (cache.hasOwnProperty(k)) {
				entries.push(k);
			}
		}
		return entries;
	};


	var _size = function() {
		return size;
	};

	return {
		put : _put,
		get : _get,
		getAll : _getAll,
		keySet : _keySet,
		clear : _clear,
		size : _size,
		remove : _remove
	};
};