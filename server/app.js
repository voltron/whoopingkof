/**
 * Module dependencies.
 */

var sys = require('sys'),
	express = require('express'),
    connect = require('connect');
	ws = require('websocket-server');

// Create and export Express app

var app = express.createServer();

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.use('/', connect.bodyDecoder());
    app.use('/', connect.methodOverride());
    app.use('/', connect.staticProvider(__dirname + '/public')); // Will fallback to static html files if no rendering engine is provided in the URI route.
});

app.configure('development', function(){
    app.set('reload views', 1000);
    app.use('/', connect.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
   app.use('/', connect.errorHandler()); 
});

// Web Socket Server

// Require whoopingkof
var whoopingkof = require(__dirname + '/lib/whoopingkof');

// Initialize a whoopingkof broadcast server and have it listen on port 8080
var broadcast = whoopingkof.create();
broadcast.open(8080);

// Create the chat server
var chat = (function(port) { 
	// Create the chat server
	var server = whoopingkof.create();

	// Set the client data
	server.extendClient({ 'name': '' });
	
	// Listen for the whoopingkof connected event
	server.on('connected', function(conn) {
		var users = [];
		var clients = server.getClients();
		for (var clientId in clients)
		{
			var client = clients[clientId];
			if (client.id != conn.id && client.name != '')
			{
				users.push({ id: client.id, name: client.name });
			}
		}
		if (users.length > 0)
		{
			server.send(conn, { 'type': 'users', 'to': conn.id, 'data': users });
		}
	});
	
	// Bind to the whoopingkof onMessage delegate
	server.onMessage = function(conn, message)
	{
		var client = server.getClient(message.sender);
		if (client && client != null)
		{
			if ((message.type == 'nickname' || message.type == 'users') && message.data != '')
			{
				if (message.type == 'nickname')
				{
					client.name = message.data;
				}
				return message;
			}
			else if (client.name != '')
			{
				if (message.type == 'message' && message.to && message.to != '')
				{
					server.notifySender(message);
				}
				return message;
			}
		}
		return null;
	};
		
	// Open the chat server on the specified port
	server.open(port);
	
	return this; 
})(8081);

// Create the game server
var game = (function(port) { 
	// Create the game server
	var server = whoopingkof.create();

	// Set the client data
	server.extendClient({ 'player': -1 });
	
	// Current player
	var players = [-1, -1];
	var turn = -1;
	var cells = [];
	var winPaths = [[0, 1], [3, 1], [6, 1], [0, 3], [1, 3], [2, 3], [0, 4], [2, 2]];
	
	// Listen for the whoopingkof connected event
	server.on('disconnected', function(conn) {
		var winner = -1;
		var winnerId = -1;
		if (players[0] == conn.id)
		{
			winner = 1;
			winnerId = players[1];
		}
		else if (players[1] == conn.id)
		{
			winner = 0;
			winnerId = players[0];
		}
		if (winner != -1 && winnerId != -1)
		{
			reset();
			var status = createStatus(false);
			status.data = server.merge(status.data, { winner: winner });
			server.send({ id: 0 }, status);
		}
	});
	
	// Bind to the whoopingkof onMessage delegate
	server.onMessage = function(conn, message)
	{
		var status;
		var client = server.getClient(message.sender);
		if (client && client != null)
		{
			if (message.type == 'join' && client.player == -1)
			{
				if (players[0] == -1)
				{
					players[0] = message.sender;
					client.player = 0;
					turn = 0;
				}
				else if (players[1] == -1)
				{
					players[1] = message.sender;
					client.player = 1;
					turn = 1;
				}
				if (client.player != -1 && players[0] != -1 && players[1] != -1)
				{
					clearCells();
					server.send(conn, createStatus(true));
				}
				if (client.player == -1)
				{
					// Game already in progress, send status
					status = createStatus(false);
					status.to = conn.id;
					server.send(conn, status);
				}
				message.data = { player: client.player };
				message.to = message.sender;
				return message;
			}
			else if (message.type == 'turn' && client.player != -1)
			{
				if (turn != -1 && message.sender == players[turn])
				{
					var index = Number(message.data.cell);
					if (!isNaN(index) && cells[index] == -1)
					{
						cells[index] = client.player;
						status = createStatus(true);
						var win = checkForWin();
						if (win != null) 
						{
							status.data = server.merge(status.data, win);
						}
						server.send(conn, status);
					}
				}
				return null;	
			}
			return message;
		}
		else if (message.type == 'status' && message.sender == 0)
		{
			return message;
		}
		return null;
	};
	
	// Reset the game
	function reset()
	{
		players = [-1, -1];
		for (var client in server.clients)
		{
			client.player = -1;
		}		
	}
	
	// Clear the cells
	function clearCells()
	{
		cells = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
	}

    // Check the board for a win
    function checkForWin()
    {
    	var length = winPaths.length;
    	// Check paths for win
		for (var i = 0; i < length; i++)
    	{
    		if (winPaths[i].length == 2)
    		{
    			var path = checkPathForWin(winPaths[i]);
    			if (path != null && path.length == 3)
    			{
    				return { winner: cells[path[0]], win: path };
    			}
    		}
    	}
    	return null;
    }
    
    // Check a row for a win
    function checkPathForWin(path)
    {
    	if (path != null && path.length && path.length == 2)
    	{
    		var firstIndex = path[0];
    		var increment = path[1];
	    	var secondIndex = firstIndex + increment;
	    	var thirdIndex = firstIndex + (increment * 2);
	    	var value = cells[firstIndex];
	    	if (value != -1 && value == cells[secondIndex] && value == cells[thirdIndex])
	    	{
	    		return [firstIndex, secondIndex, thirdIndex];
	    	}
    	}
    	return null;
    }
	
	// Dispatch the current status
	function createStatus(updateTurn)
	{
		if (updateTurn) 
		{
			turn = ++turn % 2;
		}
		return { type: 'status', data: { turn: players[turn], cells: cells } };
	}
	
	// Open the game server on the specified port
	server.open(port);
	
	return this; 
})(8082);

// Express app listen on port 3000
app.listen(3000);
