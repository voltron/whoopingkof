$(function(){
	
	// Paint application
	var $canvas = $('#paint');
	
	if ($canvas.length === 1) 
	{
		// Set the canvas width and height
		var $document = $(document);
		$canvas.attr({ 'width': $document.width(), 'height': $document.height() });
		// Initialize variables
		var canvas = $canvas.get(0);
		var isDrawing = false;
		var id = '';
		var touchId = '';
		var offset = $canvas.offset();
		var context = canvas.getContext('2d');
		// Initialize the drawing style
		context.strokeStyle = '#000';
		context.lineCap = 'round';
		context.lineWidth = 1;

		// Bind event listeners
		$('.brush-color').live(window.$w.clickEvent, function(){
			context.strokeStyle = parseId( this.id );
			broadcastCanvasStyle( {'strokeStyle': context.strokeStyle} );
			window.$w.toggleMenu();
			return false;
		});

		$('.brush-size').live(window.$w.clickEvent, function(){
			context.lineWidth = parseId( this.id );
			broadcastCanvasStyle( {'lineWidth': context.lineWidth} );
			window.$w.toggleMenu();
			return false;
		});

		if (window.$w.hasTouchSupport)
		{
			document.addEventListener('touchstart', touchStartHandler, false);
			document.addEventListener('touchmove', touchMoveHandler, false);
			document.addEventListener('touchend', touchEndHandler, false);
		}
		else
		{
			$canvas.bind('mousedown.paint', mouseDownHandler).bind('mouseup.paint', mouseUpHandler).bind('mousemove.paint', mouseMoveHandler).bind('mouseout.paint', mouseOutHandler);
		}
		// Initialize whoopingkof
		whoopingkof.onConnect(onConnect);
		whoopingkof.onDisconnect(onDisconnect);
		whoopingkof.subscribe('identity', identifyHandler);
		whoopingkof.subscribe('start stop draw', drawHandler);
		whoopingkof.subscribe('styleChange', styleHandler );
		whoopingkof.subscribe('clearCanvas', clearCanvasHandler)

		// Connect whoopingkof
		window.$w.connect();
		
    	// Mouse down event handler
    	function mouseDownHandler(e)
    	{
    		handleStart(e.offsetX, e.offsetY);
    	}

		// Mouse up event handler
    	function mouseUpHandler(e)
    	{
    		handleStop(e.offsetX, e.offsetY);
    	}
    	
    	// Mouse move event handler
    	function mouseMoveHandler(e)
    	{
			handleDraw(e.offsetX, e.offsetY);
    	}
    	
    	// Mouse out event handler
    	function mouseOutHandler(e)
    	{
    		mouseUpHandler(e);
    	}
    	
    	// Touch start event handler
    	function touchStartHandler(e)
    	{
    		if (whoopingkof.isConnected() && !window.$w.isMenuOpen() && touchId === '' && e.touches.length > 0)
    		{
    			var touch = e.touches[0];
    			touchId = touch.identifier;
    			if (handleStart(offset.top + touch.pageX,  offset.left + touch.pageY))
    			{
   					e.preventDefault();
   				}
   				else
   				{
    				touchId = '';
    			}
    		}
		}    	

    	// Touch move event handler
    	function touchMoveHandler(e)
    	{
    		if (whoopingkof.isConnected() && touchId !== '' && e.changedTouches.length > 0)
    		{
				e.preventDefault();
    			var length = e.changedTouches.length;
    			for (var i = 0; i < length; i++)
    			{
    				var touch = e.changedTouches[i];
    				if (touch.identifier == touchId)
    				{
    					handleDraw(offset.top + touch.pageX,  offset.left + touch.pageY);
    					break;
    				}
    			}
			} 
		}    	
		
    	// Touch end event handler
    	function touchEndHandler(e)
    	{
    		if (whoopingkof.isConnected() && touchId !== '' && e.changedTouches.length > 0)
    		{	
				e.preventDefault();
    			var length = e.changedTouches.length;
    			for (var i = 0; i < length; i++)
    			{
    				var touch = e.changedTouches[i];
    				if (touch.identifier == touchId)
    				{
    					handleStop(offset.top + touch.pageX,  offset.left + touch.pageY);
    					break;
    				}
    			}	
				touchId = '';
    		}
			resetDrawing();
		}    	
		
		function handleStart(x, y)
		{
			if (startDrawing(x, y))
			{
     			whoopingkof.dispatch('start', { 'x': x, 'y': y });
     			return true;
			}
			return false;
		}

		function handleStop(x, y)
		{
			if (stopDrawing(x, y))
			{
     			whoopingkof.dispatch('stop', { 'x': x, 'y': y });
     			return true;
			}
			return false;
		}

		function handleDraw(x, y)
		{
			if (draw(x, y))
			{
     			whoopingkof.dispatch('draw', { 'x': x, 'y': y });
     			return true;
			}
			return false;
		}
    	
    	// Start drawing
    	function startDrawing(x, y)
    	{
    		if (!isDrawing)
    		{
        		isDrawing = true;
        		context.beginPath();
        		context.moveTo(x, y);
        		return true;
    		}
    		return false;
    	}
    	
    	// Stop drawing
    	function stopDrawing(x, y)
    	{
    		if (isDrawing)
    		{
    			draw(x, y);
    			resetDrawing();
        		return true;
    		}
    		return false;
    	}

		function resetDrawing()
		{
			context.closePath();
    		isDrawing = false;
		}
		
		function draw(x, y)
		{
    		if (isDrawing)
    		{
    			context.lineTo(x, y);
    			context.stroke();
    			return true;
    		}
    		return false;
		}
    	
    	// whoopingkof connect callback
    	function onConnect()
    	{
    	}
    	
    	// whoopingkof disconnect callback
    	function onDisconnect()
    	{
    		id = '';
    	}
    	
    	// whoopingkof identify handler
		function identifyHandler(message)
		{
			id = message.sender;
		}
    	
    	// Draw the line send over WebSocket
    	function drawHandler(message)
    	{
    		if (message.sender != id && message.data.x && message.data.y)
    		{
    			var x = message.data.x;
    			var y = message.data.y;
    			if (message.type == 'start')
    			{
        			startDrawing(x, y);
    			}
    			else if (message.type == 'draw')
    			{
        			draw(x, y);
    			}
    			else if (message.type == 'stop')
    			{
    				stopDrawing(x, y);
    			}
    		}
    	}

    	function styleHandler(message)
    	{
			if (message.sender != id && (typeOf(message.data) === 'object') )
    		{
				// Only works in ES5 compliant browsers.
				var keys=Object.keys(message.data);
				context[keys[0]] = message.data[keys[0]];
    		}
    	}

		function clearCanvasHandler(message)
		{
			if (message.sender != id && message.data.clear )
    		{
				clearCanvas();
    		}

		}


		// Parse the user id from an element id
	    function parseId(value)
	    {
		 	return value.length > 1 ? value.substr(1) : '';
 	    }

		// Crockford!
		function typeOf(value) {
		    var s = typeof value;
		    if (s === 'object') {
		        if (value) {
		            if (value instanceof Array) {
		                s = 'array';
		            }
		        } else {
		            s = 'null';
		        }
		    }
		    return s;
		}

		function broadcastCanvasStyle(obj){
			// ES5 FTW
			// May be used later for iteration over keys and their values.
			/*
			for (var i=0, keys=Object.keys(obj), len = keys.length; i<len; i++) 
			{    
				obj[keys[i]];   
			}
			*/
			whoopingkof.dispatch('styleChange', obj);
		}
		
		function broadcastClear()
		{
			window.whoopingkof.dispatch('clearCanvas', {'clear': true} );
		}
		
		function clearCanvas()
		{
			context.clearRect(0, 0, $canvas.width(), $canvas.height());
		}

		// context.lineWidth = 1;
		// Setup menu.
			var options = {
				cells: 
				[
					{
						label: null, 
						handler: function(){
							return false;
						},
						customHtml: '<span class="brush-size custom" id="s1">1</span><span class="brush-size custom" id="s6">6</span><span class="brush-size custom" id="s12">12</span>'
					},
					{	
						label: null, 
						handler: function(){
							return false;
						},
						customHtml: '<span class="brush-color custom" id="cFF0000">Red</span><span class="brush-color custom" id="c00FF5E">Green</span><span class="brush-color custom" id="c0044FF">Blue</span>'
					}
				],
				bottom: false,
				rows: true
			}

		
			var optionsBottom = {
				cells: 
				[
					{
						label: 'Clear', 
						iconClass: 'menu-icon-clear', 
						handler: function(){
				 			window.$w.toggleMenu();
							clearCanvas();
							broadcastClear();
							return false;
						}
					}
				],
				bottom: true,
				rows: false
			}

			window.$w.subscribe('menu', function(){
				window.$w.toggleMenu();
			});

			window.$w.customMenu(options);
			window.$w.customMenu(optionsBottom);
	
	
	}
	
});