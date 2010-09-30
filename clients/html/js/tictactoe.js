$(function(){
	
	var $canvas = $('#game');
	
	if ($canvas.length === 1) 
	{
		// Initialize variables
		var $join = $("#joinGame").hide().bind('click', joinClickHandler);
		var id = '';
		var canvas = $canvas.get(0);
		var context = canvas.getContext('2d');
		var defaultCell = { x: 0, y: 0, hoverLeft: 0, hoverTop: 0, hoverRight: 0, hoverBottom: 0, centerX: 0, centerY: 0, radius: 0, state: -1, column: -1, row: -1 };
		var player = -1;
		var isPlaying = false;
		var isTurn = false;
		var hoverIndex = -1;
		var padding = 20;
		var lineSize = 4;
		var lineOffset = lineSize / 2;
		var canvasTop = $canvas.offset().top;
		var gridSize, cellSize, hoverSize, horizontalOffset, verticalOffset, hoverOffset, cellRadius;
		
		// Initialize the cells		
		var cells = [];
		var win = [];
		initializeCells();

		// Bind the resize handler
		$(window).bind('resize', resizeHandler);
		resizeHandler();
				
		// Initialize whoopingkof
		whoopingkof.onConnect(onConnect);
		whoopingkof.onDisconnect(onDisconnect);
		whoopingkof.subscribe('identity', identifyHandler);
		whoopingkof.subscribe('join', joinHandler);
		whoopingkof.subscribe('status', statusHandler);
		
		// Connect whoopingkof
        window.$w.connect({ 'port': 'game' });

    	// whoopingkof connect callback
    	function onConnect()
    	{
    	}
    	
    	// whoopingkof disconnect callback
    	function onDisconnect()
    	{
    		id = '';
    		$join.hide();
    	}
    	
    	// whoopingkof identify handler
		function identifyHandler(message)
		{
			id = message.sender;
			$join.show();
//			join();
		}
		
		// join message handler
		function joinHandler(message)
		{
			player = message.data.player;
			if (player == 0 || player == 1)
			{
				log("You are " + getSymbol(player) + "s");
        		bindEvents();
			}
			else
			{
				log("You are watching a game in progress");
			}
		}

		// status message handler
		function statusHandler(message)
		{
			var hasUpdate = false;
    		if (!isPlaying)
    		{
        		// Reset the game state and initialize
        		reset();
        		isPlaying = true;
        		bindEvents();
    		}
    		if (isPlaying)
    		{
				// Determine turn
				isTurn = message.data.turn == id;
    			// Update the game state
    			var length = message.data.cells.length;
    			if (cells.length == length) 
    			{
	    			for (var i = 0; i < length; i++) 
	    			{
	    				if (message.data.cells[i].state != cells[i]) 
	    				{
	    					cells[i].state = message.data.cells[i];
	    					hasUpdate = true;
	    				}
	    			}
    			}
    			// Check if a winner was declared
    			if (message.data.winner != undefined) 
    			{
    				if (message.data.winner != -1)
    				{
	    				log('Player ' + getSymbol(message.data.winner) + ' wins!');
	    				// Store the win and mark for render
	    				hasUpdate = true;
	    				win = message.data.win;
    				}
    				// Unbind event and set playing flag
    				$canvas.unbind('.ttt');
    				isPlaying = false;
    			}
    			// Render if an update
    			if (hasUpdate) 
    			{
    				render();
    			}
    		}
		}
		
		// Bind events to canvas		
		function bindEvents() {
			if (player != -1 && isPlaying) 
			{
            	// Bind events
            	$canvas.bind('mousemove.ttt', mouseMoveHandler).bind('mouseout.ttt', mouseOutHandler).bind('click.ttt', clickHandler);
			}
		}
		
		// Join button click handler
		function joinClickHandler(e)
		{
			join();
			$(this).hide();
			return false;
		}
		
		// Handle window resize event
		function resizeHandler(e)
		{
			// Set the canvas width and height
			var $window = $(window);
			$canvas.attr({ 'width': $window.width(), 'height': $window.height() - canvasTop });
			// Initialize measurements
			gridSize = Math.min(canvas.width, canvas.height) - (padding * 2);
			cellSize = gridSize / 3;
			hoverSize = cellSize - (padding * 2);
			horizontalOffset = Math.floor((canvas.width - gridSize) / 2);
			verticalOffset = Math.floor((canvas.height - gridSize) / 2);
			hoverOffset = Math.floor((cellSize - hoverSize) / 2);
			cellRadius = hoverSize / 2;
			// Update the cells
			for (var i = 0; i < 9; i++)
			{
				updateCell(cells[i]);
			}
			// Render the grid
			render();
		}
	
    	// Mouse move event handler
    	function mouseMoveHandler(e)
    	{
    		if (whoopingkof.isConnected() && isPlaying && isTurn)
    		{
	    		var index = getIndex(e);
	    		if (index != -1)
	    		{
	    			if (index != hoverIndex)
	    			{
	    				hoverIndex = index;
	    				render();
	    			}
	    			return;
	    		}
	    		mouseOutHandler();
    		}
    	}
    	
    	// Mouse out event handler
    	function mouseOutHandler(e)
    	{
    		if (whoopingkof.isConnected() && isPlaying && isTurn && hoverIndex != -1)
    		{
       			hoverIndex = -1;
       			render();
    		}
    	}
    	
    	// Click event handler
    	function clickHandler(e)
    	{
    		if (whoopingkof.isConnected() && isPlaying && isTurn)
    		{
	    		var index = getIndex(e);
	    		if (index != -1)
	    		{
	    			var cell = cells[index];
	    			if (cell.state == -1)
	    			{
	    				whoopingkof.dispatch('turn', { cell: index });
	    			}
	    		}
    		}
    	}

		// Initialize the cells
		function initializeCells()
		{
			for (var i = 0; i < 9; i++)
			{
				var cell = $.extend({}, defaultCell);
				if (i % 3 == 0)
				{
					cell.column = 0;
				}
				else if ((i - 1) % 3 == 0)
				{
					cell.column = 1;
				}
				else
				{
					cell.column = 2;
				}
				if (i < 3)
				{
					cell.row = 0;
				}
				else if (i < 6)
				{
					cell.row = 1;
				}
				else
				{
					cell.row = 2;
				}
				updateCell(cell);
				cells.push(cell);
			}
		}
		
		// Update cell position
		function updateCell(cell)
		{
			if (cell.column == 0)
			{
				// First column
				cell.x = horizontalOffset;
			}
			else if (cell.column == 1)
			{
				// Second column
				cell.x = horizontalOffset + (cellSize * 1);
			}
			else
			{
				// Third column
				cell.x = horizontalOffset + (cellSize * 2);
			}
			if (cell.row == 0)
			{
				// First row
				cell.y = verticalOffset;
			}
			else if (cell.row == 1)
			{
				// Second row
				cell.y = verticalOffset + (cellSize * 1);
			}
			else
			{
				// Third row
				cell.y = verticalOffset + (cellSize * 2);
			}
			cell.hoverLeft = cell.x + hoverOffset - lineOffset;
			cell.hoverRight = cell.hoverLeft + hoverSize + lineSize;
			cell.hoverTop = cell.y + hoverOffset - lineOffset;
			cell.hoverBottom = cell.hoverTop + hoverSize + lineSize;
			cell.radius = cellRadius;
			cell.centerX = cell.hoverLeft + cell.radius + lineOffset;
			cell.centerY = cell.hoverTop + cell.radius + lineOffset;
		}
		
		// Join a game
		function join()
		{
			if (!isPlaying && whoopingkof.isConnected() && id != '')
			{
     			whoopingkof.dispatch('join');
			}
		}

    	// Reset the game
    	function reset()
    	{
    		var length = cells.length;
    		for (var i = 0; i < length; i++)
    		{
    			cells[i].state = -1;
    		}
    		win = [];
    		hoverIndex = -1;
    		render();
    	}

    	// Get the index for mouse position
    	function getIndex(e)
    	{
    		var column = Math.floor((e.offsetX - horizontalOffset) / cellSize);
    		var row = Math.floor((e.offsetY - verticalOffset) / cellSize);
    		if (column >= 0 && column < 3 && row >= 0 && row < 3)
    		{
    			return (row * 3) + column;
    		}
    		return -1;
    	}	

		// Render the game
		function render()
	    {
	    	renderBackground();
	    	renderGrid();
	    	for (var i = 0; i < cells.length; i++)
	    	{
	    		renderCell(i);
	    	}
	    	if (win.length == 3)
	    	{
	    		renderWin();
	    	}
		}
				
		// Render the background
		function renderBackground()
		{
			var gradient = context.createLinearGradient(0, 0, 0, canvas.height);
			gradient.addColorStop(0, '#3b587a');
			gradient.addColorStop(1, '#c5e9e7');
			context.fillStyle = gradient;
			context.fillRect(0, 0, canvas.width, canvas.height);
		}

		// Render the grid
		function renderGrid()
		{
			// Initialize the drawing style
			context.strokeStyle = '#ccc';
			context.lineCap = 'round';
			context.lineWidth = lineSize;
			context.shadowOffsetX = context.shadowOffsetY = 1;
			context.shadowBlur = 1;
			context.shadowColor = '#676767';
			// Draw the lines
			var near = verticalOffset + cellSize;
			var far = near + cellSize;
			var start = horizontalOffset - lineOffset;
			var end = start + gridSize + lineSize;
			context.beginPath();
			drawLine(start, near, end, near);
			drawLine(start, far, end, far);
			near = horizontalOffset + cellSize;
			far = near + cellSize;
			start = verticalOffset - lineOffset;
			end = start + gridSize + lineSize;
			drawLine(near, start, near, end);
			drawLine(far, start, far, end);
			context.closePath();
		}

		// Render a cell
		function renderCell(index)
		{
			if (index >= 0 && index < cells.length)
			{
				var cell = cells[index];
				if (cell.state == 0 || cell.state == 1)
				{
					renderCaptured(cell, cell.state == 0);
				}
				else if (cell.state == -1 && hoverIndex == index)
				{
					renderHover(cell);
				}
			}					
		}
		
		// Draw the hover state
		function renderHover(cell)
		{
			// Initialize the drawing style
			context.fillStyle = 'rgba(255, 255, 255, .1)';
			context.strokeStyle = 'rgba(255, 255, 255, .85)';
			context.lineJoin = 'round';
			context.lineWidth = lineSize;
			context.shadowOffsetX = context.shadowOffsetY = 1;
			context.shadowBlur = 1;
			context.shadowColor = '#676767';
			// Draw the hover
			context.beginPath();
			context.moveTo(cell.hoverLeft, cell.hoverTop);
			context.lineTo(cell.hoverRight, cell.hoverTop);
			context.lineTo(cell.hoverRight, cell.hoverBottom);
			context.lineTo(cell.hoverLeft, cell.hoverBottom);
			context.lineTo(cell.hoverLeft, cell.hoverTop);
			context.fill();
			context.stroke();
			context.closePath();
		}
		
		// Draw the captured cell
		function renderCaptured(cell, player1)
		{
			// Initialize the drawing style
			var gradient = context.createLinearGradient(cell.hoverLeft, cell.hoverTop, cell.hoverRight, cell.hoverBottom);
			if (player1)
			{
				gradient.addColorStop(0, '#e70a0a');
				gradient.addColorStop(1, '#771818');
			}
			else
			{
				gradient.addColorStop(0, '#1db112');
				gradient.addColorStop(1, '#0e7a06');
			}
			// Draw a circle using arcs
			context.strokeStyle = gradient;
			context.lineWidth = lineSize;
			context.beginPath();
			if (player1)
			{
				context.arc(cell.centerX, cell.centerY, cell.radius, 0, 360, false);
			}
			else
			{
				context.moveTo(cell.hoverLeft, cell.hoverTop);
				context.lineTo(cell.hoverRight, cell.hoverBottom);
				context.moveTo(cell.hoverLeft, cell.hoverBottom);
				context.lineTo(cell.hoverRight, cell.hoverTop);
			}
			context.stroke();
			context.closePath();
		}
		
		// Render a win
		function renderWin()
		{
			if (win.length == 3)
			{
				// Initialize the drawing style
				context.fillStyle = 'rgba(245, 245, 25, .1)';
				context.strokeStyle = 'rgba(245, 245, 25, .85)';
				context.lineJoin = 'round';
				context.lineWidth = lineSize;
				context.shadowOffsetX = context.shadowOffsetY = 1;
				context.shadowBlur = 1;
				context.shadowColor = '#676767';
				// Draw the win
				var start = cells[win[0]];
				var end = cells[win[2]];
				context.beginPath();
				drawLine(start.centerX, start.centerY, end.centerX, end.centerY);
				context.closePath();
			}
		}
		
		// Draw a line
		function drawLine(x1, y1, x2, y2)
		{
			context.moveTo(x1, y1);
			context.lineTo(x2, y2);		
			context.stroke();
		}	
		
		// Log a message
		function log(message)
		{
			$("#message").text(message);
		}
		
		// Get the player symbol
		function getSymbol(index)
		{
			return index == 0 ? "O" : "X"
		}
			
	}
	
});
