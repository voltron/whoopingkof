;
if (!window.WebSocket && window.WebSocketExt)
{
    (function(window)
    {
    	// Dictionary of sockets
    	var sockets = {};
    	
    	// Add a new socket to the dictionary
		function addSocket(socket)
		{
			sockets[socket.getId()] = socket;
		}
    
    	// Remove a socket from the dictionary
    	function removeSocket(id)
    	{
    		if (sockets[id])
    		{
    			delete sockets[id];
    		}
    	}
    
    	// Get a socket from the dictionary
    	function getSocket(id)
    	{
    		if (sockets[id])
    		{
    			return sockets[id];
    		}
    		return null;
    	}
    
		// Create the WebSocket object
		var WebSocket = function(url, protocol)
		{
			// Validate the arguments
			if (!url || url === null || url === '')
			{
				throw 'Invalid URL';
			}
			if (!protocol || protocol == null)
			{
				protocol = '';
			}
			// Initialize the object
			var id = 'test';
			this.url = url;
			this.onopen = null;
			this.onclose = null;
			this.onmessage = null;
			
			// Close the WebSocket connection
			this.close = function()
			{
				if (id != '' && window.WebSocketExt)
				{
					window.WebSocketExt.close(id);
				}
			};
			
			// Send a message over the WebSocket
			this.send = function(data)
			{
				if (id != '' && window.WebSocketExt)
				{
					return window.WebSocketExt.send(id, data);
				}
				return false;
			};
			
			// Expose the WebSocket ID
			this.getId = function()
			{
				return id;
			}

			// Open the connection
			if (window.WebSocketExt)
			{
				id = window.WebSocketExt.open(url, protocol);
			}
			
			// Add the WebSocket
			addSocket(this);
		};
		
		// WebSocketManager onOpen callback
		WebSocket.onOpen = function(id)
		{
			var socket = getSocket(id);
			if (socket && socket != null)
			{
				if (socket.onopen && typeof(socket.onopen) == "function")
				{
					try
					{
						socket.onopen();
					}
					catch (e)
					{
					}
				}
			}
		};
		
		// WebSocketManager onClose callback
		WebSocket.onClose = function(id)
		{
			var socket = getSocket(id);
			if (socket && socket != null)
			{
				if (socket.onclose && typeof(socket.onclose) == "function")
				{
					try
					{
						socket.onclose();
						deleteSocket(id);
					}
					catch (e)
					{
					}
				}
			}
		};

		// WebSocketManager onMessage callback
		WebSocket.onMessage = function(id, data)
		{
			var socket = getSocket(id);
			if (socket && socket != null)
			{
				if (socket.onmessage && typeof(socket.onmessage) == "function")
				{
					try
					{
						socket.onmessage({ 'data': data });
					}
					catch (e)
					{
					}
				}
			}
		};
		
		window.WebSocket = WebSocket;
	})(window);	
}
