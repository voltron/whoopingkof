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
		var queue = [];
		// Initialize the drawing style
		context.strokeStyle = '#000';
		context.lineCap = 'round';
		context.lineWidth = 1;

		// Bind event listeners
		$('.brush-color').live(window.$w.clickEvent, function(e){
			context.strokeStyle = parseId( this.id );
			broadcastCanvasStyle( {'strokeStyle': context.strokeStyle} );
			window.$w.toggleMenu();
			return false;
		});

		$('.brush-size').live(window.$w.clickEvent, function(e){
			console.log("id = " + e.target.id);
			context.lineWidth = parseId( this.id );
			broadcastCanvasStyle( {'lineWidth': context.lineWidth} );
			console.log("brush size: " + context.lineWidth);
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
		whoopingkof.subscribe('canvasImage', canvasImageHandler)
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
			while (queue.length > 0)
			{
				var item = queue.shift();
				if (item.type && item.data)
				{
					window.whoopingkof.dispatch(item.type, item.data);				
				}
			}
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

    	function canvasImageHandler(message)
    	{
    		console.log(message);
			if (message.sender != id)
			{
				clearCanvas();
				if (window.WhoopingkofExt)
				{
					selectPictureHandler('/mnt/sdcard/wireframe.png', false);	
				}
				else
				{
					loadWebImage(false);
				}	
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

		function emailImage()
		{
			if (window.WhoopingkofExt)
			{
				setTimeout(sendEmail, 500);
			}
			else
			{
				var data = canvas.toDataURL("image/png");
				if (!window.$w.isInvalidDataURI(data))
				{
					window.open(data);
				}
			}
		}
				
		function sendEmail()
		{
			window.WhoopingkofExt.captureAsEmail('', 'Wireframe updates', 'I made some changes to the wireframes.  Please review.');
		}
				
		function loadImage()
		{
			if (window.WhoopingkofExt)
			{
				window.WhoopingkofExt.selectPicture();
			}
			else
			{
				loadWebImage(true);
			}
		}
		
		function loadWebImage(dispatch)
		{
			selectPictureHandler('img/wireframe.png', dispatch);
		}

		function selectPictureHandler(data, dispatch) 
		{
			dispatch = (dispatch === false) ? false : true;
			if (!window.whoopingkof.isConnected())
			{
				window.$w.connect();
			}
			var img = new Image();
			img.onload = function(){
			    context.drawImage(img, 0, 0, img.width, img.height);
			    if (dispatch)
			    {
			    	sendWithQueue('canvasImage', {});
			    }
			}
			img.src = data;
		};
		window.$w.subscribe('selectPicture', selectPictureHandler);

		function dispatchCanvasImage()
		{
			var dataUrl = getDataURL();
			if (dataUrl != '')
			{
				sendWithQueue('canvasImage', { 'image': dataUrl });
			}
		}
		
		// Send a message or queue if not connected
		function sendWithQueue(type, data)
		{
			if (!window.whoopingkof.isConnected() || id == '')
			{
				queue.push({ type: type, data: data });
			}
			else
			{
				window.whoopingkof.dispatch(type, data);
			}
		}
		

		// Get base64 encoded image data
		function getDataURL()
		{
			var data = canvas.toDataURL('image/png');
			if (window.$w.isInvalidDataURI(data))
			{
				data = '';
				if (window.WhoopingkofExt)
				{
					data = window.WhoopingkofExt.captureAsDataURI();
					if (data != '')
					{
						data = 'data:image/png;base64,' + data;
					}
				}
			}
			return data;
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
							console.log('clear!');
							window.$w.toggleMenu();
							clearCanvas();
							broadcastClear();
							return false;
						}
					},
					{	
						label: 'Email', 
						iconClass: 'menu-icon-capture', 
						handler: function(){
							window.$w.toggleMenu();
							emailImage();
							return false;
						}
					},
					{	
						label: 'Load Image', 
						iconClass: 'menu-icon-load', 
						handler: function(){
							window.$w.toggleMenu();
							loadImage();
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