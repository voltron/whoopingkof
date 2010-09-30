var sys = require('sys'),
	events = require("events");

// Require websocket server (must be in path)
var ws = require('websocket-server');

// Whoopingkof exports
exports.Whoopingkof = Whoopingkof;
exports.create = function(options) 
{
	return new Whoopingkof(options);
};

// Default options object
var defaultOptions = { 'debug': true };

// Default data object
var defaultData = { 'type': '', 'sender': '', 'to': '', 'data': '' };

// whoopingkof implementation
function Whoopingkof(options)
{
	// Store a reference to instance
	var self = this;
	// Merge the options with the default options
	options = this.merge(options, defaultOptions);
	this.debug = !!options.debug;
	
	// Regex to test for script tags
	var scriptPattern = new RegExp("<script.*?</script", "ig");

	// Initialize delegate callbacks
	this.onMessage = null;
	
	// Initialize the event emitter
	events.EventEmitter.call(this);

	// Create a dictionary of connected clients
	var clients = {};
	
	// Client data
	var clientData = { 'id': '' };
	
	// Server open status
	var isOpen = false;

	// Create the server and add event listeners
	this.server = ws.createServer({ debug: self.debug });
	this.server.addListener('listening', function() {
		isOpen = true;
		self.log('whoopingkof connection open...');
	});
	this.server.addListener('connection', function(conn) {
		self.log('Client connected: ' + conn.id);
		// Store connected client
		if (!clients[conn.id])
		{
			clients[conn.id] = self.merge({}, clientData);
			clients[conn.id].id = conn.id;
		}
		// Send identify message
		var data = self.merge({ 'type': 'identity', 'to': conn.id }, defaultData);
		self.send(conn, data);
		// Broadcast connected message
		data = self.merge({ 'type': 'connected' }, defaultData);
		self.send(conn, data);
		// Dispatch the connected event
		self.emit('connected', conn);
		conn.addListener('message', function(message) {
			self.send(conn, message);
		});
	});
	this.server.addListener('close', function(conn) {
		self.log('Client disconnected: ' + conn.id);
		var data = self.merge({ 'type': 'disconnected', 'sender': conn.id }, defaultData);
		self.server.broadcast(JSON.stringify(data));
		// Delete the client
		if (clients[conn.id])
		{
			delete clients[conn.id];
		}
		// Dispatch the disconnected event
		self.emit('disconnected', conn);
	});	
	
	// Send a message
	this.send = function(conn, message)
	{
		try
		{
			var isObject = typeof(message) == 'object';
		    if (!isObject && scriptPattern.test(message))
		    {
		        self.log('<script> payload found - disconnecting ' + conn.id);
		        conn.close();
		    }
		    else
		    {
				var data = isObject ? message : JSON.parse(message);
				if (data.type == 'ping') return;
				data = self.merge(data, defaultData);
				data.sender = conn.id;
				if (data.type != 'connected' && data.type != 'disconnected' && data.type != 'identity' && typeof(self.onMessage) == 'function')
				{
					data = self.onMessage(conn, data);
				}
				if (data && data != null && data != '')
				{
					var notifySender = data.notifySender && data.notifySender === true;
					delete data.notifySender;
				    var textData = JSON.stringify(data);
				    if (data.to && data.to != null && data.to != '')
				    {
						self.log('Sending message from ' + conn.id + ' to ' + data.to + ': ' + textData);
						self.server.send(Number(data.to), textData);
						if (notifySender && conn.id != "")
						{
							self.log('Notifying sender ' + conn.id + ': ' + textData);
							self.server.send(Number(conn.id), textData);
						}
				    }
				    else
				    {
						self.log('Broadcasting message from ' + conn.id + ': ' + textData);
						self.server.broadcast(textData);
				    }
				}
		    }
		}
		catch (err)
		{
			self.log('Error handling message: ' + err);
		}
	};
	
	this.sendMessage = function(data, connId)
	{
	
	};
	
	// Extend the default client data (perform before server.open)	
	this.extendClient = function(data)
	{
		if (!isOpen)
		{
			clientData = self.merge(clientData, data);
		}
	};
	
	// Get client object
	this.getClient = function(id)
	{
		if (clients[id])
		{
			return clients[id];
		}
		return null;
	};
	
	// Get all client objects
	this.getClients = function()
	{
		return clients;
	};
	
};
sys.inherits(Whoopingkof, events.EventEmitter);

// Merge the contents of two objects.  Not a deep copy.
Whoopingkof.prototype.merge = function(target, source)
{
	target = target || {};
	for (var key in source)
	{
		if (!target[key])
		{
			target[key] = source[key];
		}
	}
	return target;
};

// Log a message
Whoopingkof.prototype.log = function(message)
{
	if (!!this.debug)
	{
		sys.log(message);
	}	
};

// Set notify sender flag for private message
Whoopingkof.prototype.notifySender = function(message)
{
	if (message.to && message.to != null && message.to != '')
	{
		message.notifySender = true;
	}
}

// Open a connection
Whoopingkof.prototype.open = function() {
	this.server.listen.apply(this.server, arguments);
};

// Close the connection
Whoopingkof.prototype.close = function() {
	this.server.close();
};
