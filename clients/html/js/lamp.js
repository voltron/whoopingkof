$(document).ready(function() {

	// Get canvas references
	var $selectH = $('#selectH');
	var $selectB = $('#selectB');

	if ($selectH.length === 1 && $selectB.length === 1) 
	{
		// Initialize variables
		var selectedColor = [180, 100, 100];
		var $toggle = $('#toggleLight');
		var isOn = false;
		var id = '';
		var contextH = $selectH.get(0).getContext('2d');
		var contextB = $selectB.get(0).getContext('2d');
		var cycleInterval;
		var cycleIndex = -1;
		var touches = {};
		var swipeMin = 120;
		
		// Bind event listeners
		$selectH.bind(window.$w.clickEvent, hueClickHandler);
		$selectB.bind(window.$w.clickEvent, brightnessClickHandler);
		$('nav a').bind(window.$w.clickEvent, navClickHandler);
		$('.content.power .on').bind(window.$w.clickEvent, onClickHandler); 
		$('.content.power .off').bind(window.$w.clickEvent, offClickHandler); 
				
		// Render the color selectors
		renderH();
		renderB();
		updateColorSummary();
		
		// Hide the non-active content
		$('section.content.brightness, section.content.power').hide();
		
		// Bind touch event handlers for detecting swipe
		function initializeTouch()
		{
			if (window.$w.hasTouchSupport)
			{
				var element = $('.content.power').get(0)
				element.addEventListener('touchstart', touchStartHandler, false);
				element.addEventListener('touchend', touchEndHandler, false);
			}
		}
		initializeTouch();
		
		// Initialize whoopingkof
		whoopingkof.onConnect(onConnect);
		whoopingkof.onDisconnect(onDisconnect);
		whoopingkof.subscribe('identity', identifyHandler);
		whoopingkof.subscribe('lampon', lampOnHandler);
		whoopingkof.subscribe('lampoff', lampOffHandler);
		whoopingkof.subscribe('lampcolor', lampColorHandler);

		// Connect whoopingkof
		window.$w.connect();

        // Navigation item click handler
        function navClickHandler(e)
        {
            var $this = $(this);
            if (!$this.hasClass('selected'))
            {
                $('nav a').removeClass('selected');
                var className = $this.attr('class');
                $this.addClass('selected');
                $('section.content.selected').stop().fadeOut(function() {
                    $(this).removeClass('selected');
                    $('section.content.' + className).addClass('selected').stop().fadeIn();
                });
            }
            return false;
        }

		// Set the hue
		function hueClickHandler(e)
		{
			if (whoopingkof.isConnected())
			{
				var imageData = contextH.getImageData(e.offsetX, e.offsetY, 1, 1);
				if (imageData.data.length >= 3)
				{
					var rgb = [imageData.data[0], imageData.data[1], imageData.data[2]];
					var hsb = RGBToHSB(rgb);
					selectedColor[0] = hsb[0];
					updateColor();
				}
			}
		}

		// Set the brightness
		function brightnessClickHandler(e)
		{
			if (whoopingkof.isConnected())
			{
				var imageData = contextB.getImageData(e.offsetX, e.offsetY, 1, 1);
				if (imageData.data.length >= 3)
				{
					var rgb = [imageData.data[0], imageData.data[1], imageData.data[2]];
					var hsb = RGBToHSB(rgb);
					selectedColor[2] = hsb[2];
					updateColor();
				}
			}
		}
		
		// On button click handler
		function onClickHandler(e)
		{
			setLampPower(true);
			return false;
		}
		
		// Off button click handler
		function offClickHandler(e)
		{
			setLampPower(false);
			return false;
		}

    	// whoopingkof connect callback
    	function onConnect()
    	{
			whoopingkof.dispatch('lampfade');
			cycleSummary();
			cycleInterval = setInterval(cycleSummary, 250);
    	}
    	
    	// whoopingkof disconnect callback
    	function onDisconnect()
    	{
    		id = '';
    		clearInterval(cycleInterval);
            clearSelectedSummaryItem();
    	}
    	
    	// whoopingkof identify handler
		function identifyHandler(message)
		{
			id = message.sender;
		}

    	// Lamp on handler
		function lampOnHandler(message)
		{
			if (message.sender != id)
			{
				setLampPower(true);
			}
		}

    	// Lamp off handler
		function lampOffHandler(message)
		{
			if (message.sender != id)
			{
				setLampPower(false);
			}
		}

    	// Lamp color handler
		function lampColorHandler(message)
		{
			if (message.sender != id)
			{
				selectedColor[0] = message.data.h;
				selectedColor[2] = message.data.b;
				updateColorSummary();
			}
		}
		
		// Set the lamp power state
		function setLampPower(on)
		{
			if (whoopingkof.isConnected() && isOn != on)
			{
				isOn = on;
				whoopingkof.dispatch(isOn ? 'lampon' : 'lampoff');
				updateColorSummary();
			}
		}
		
		// Change the color of the lamp
		function updateColor()
		{
			if (whoopingkof.isConnected())
			{
				window.whoopingkof.dispatch('lampcolor', { 'h': selectedColor[0], 's': selectedColor[1], 'b': selectedColor[2] } );		
				updateColorSummary();
			}
		}
			
		// Render the hue selector
		function renderH()
		{
			var width = $selectH.width();
			var height = $selectH.height();
			var ratio = height / 361;
			var hsb = [360, 100, 100];
			for (var i = 0; i <= 361; i++)
			{
				hsb[0] = 360 - i;
				contextH.fillStyle = HSBToHex(hsb);
				contextH.fillRect(0, i * ratio, width, ratio);
			}
		}
		
		// Render the birghtness selector
		function renderB()
		{
			var width = $selectB.width();
			var height = $selectB.height();
			var gradient = contextB.createLinearGradient(0, 0, 1, height);
			gradient.addColorStop(1, '#000000');
			gradient.addColorStop(0, '#ffffff');
			contextB.fillStyle = gradient;
			contextB.fillRect(0, 0, width, height);
		}
		
		// Convert HSB to RGB
		function HSBToRGB(hsb)
		{
			hsb = hsb || [];
			if (hsb.length != 3)
			{
				return null;
			}
			var rgb = [];
			var h = hsb[0] == 360 ? 0 : (hsb[0] / 60);
			var s = hsb[1] / 100;
			var b = hsb[2] / 100;
			if (s == 0)
			{
				rgb[0] = rgb[1] = rgb[2] = b;
			}
			else
			{
				var floor = Math.floor(h);
				var f = h - floor;
				var p = b * (1 - s);
				var q = b * (1 - s * f);
				var t = b * (1 - s * (1 - f));
				switch (floor)
				{
					case 0:
						rgb = [b, t, p];
						break;
					case 1:
						rgb = [q, b, p];
						break;
					case 2:
						rgb = [p, b, t];
						break;
					case 3:
						rgb = [p, q, b];
						break;
					case 4:
						rgb = [t, p, b];
						break;
					case 5:
						rgb = [b, p , q];
						break;
				}
			}
            if (rgb.length == 3)
            {
            	return [Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255)];
            }		
            return null;
		}
				
		// Convert RGB to HSB
		function RGBToHSB(rgb)
		{
			rgb = rgb || [];
			if (rgb.length != 3)
			{
				return null;
			}
			var hsb = [];
			var min = Math.min(rgb[0], rgb[1], rgb[2]);
			var max = Math.max(rgb[0], rgb[1], rgb[2]);
			var delta = max - min;
			hsb[1] = max != 0 ? 255 * delta / max : 0;
			hsb[2] = max;
			if (hsb[1] != 0)
			{
				if (rgb[0] == max)
				{
					hsb[0] = (rgb[1] - rgb[2]) / delta;
				}
				else if (rgb[1] == max)
				{
					hsb[0] = 2 + (rgb[2] - rgb[0]) / delta;
				}
				else
				{
					hsb[0] = 4 + (rgb[0] - rgb[1]) / delta;
				}
			}
			else
			{
				hsb[0] = -1;
			}
			hsb[0] *= 60;
			if (hsb[0] < 0)
			{
				hsb[0] += 360;
			}
			hsb[0] = Math.round(hsb[0]);
			hsb[1] = Math.round(hsb[1] * (100 / 255));
			hsb[2] = Math.round(hsb[2] * (100 / 255));
			return hsb;
		}
		
		// Convert RGB to hex
		function RGBToHex(rgb)
		{
			var rgb = rgb || [];
			if (rgb.length == 3)
			{
				var hex = [];
				for (var i = 0; i < 3; i++)
				{
					var bit = rgb[i].toString(16);
					hex.push(bit.length == 1 ? '0' + bit : bit);
				}
				return '#' + hex.join('');
			}
			return null;
		}
		
		// Convert HSB to hex
		function HSBToHex(hsb)
		{
			return RGBToHex(HSBToRGB(hsb));
		}
		
		// Update the selected color summary
		function updateColorSummary()
		{
            var html = '';
            html += createSummaryItem('status', isOn ? "on" : "off");
            html += createSummaryItem('hue', selectedColor[0]);
            html += createSummaryItem('saturation', selectedColor[1]);
            html += createSummaryItem('brightness', selectedColor[2]);
            var rgb = HSBToRGB(selectedColor);
            html += createSummaryItem('red', rgb[0]);
            html += createSummaryItem('green', rgb[1]);
            html += createSummaryItem('blue', rgb[2]);
            var hex = RGBToHex(rgb);
            html += createSummaryItem('hex', hex);
            $('.controls aside').html(html);
            $('.controls .current div').css('background-color', hex);
		}
		
		// Create a summary item
		function createSummaryItem(label, value)
		{
		  return '<p>' + label + ':<em>' + value + '</em></p>';
		}
		
		// Cycle the summary items
		function cycleSummary()
		{
            clearSelectedSummaryItem();
            cycleIndex++;
            selectSummaryItem(cycleIndex);
            if ($('.controls aside p.selected').length == 0)
            {
                cycleIndex = 0;
                selectSummaryItem(cycleIndex);
            }
		}
	   
        // Clear the selected summary item
        function clearSelectedSummaryItem()
        {
            $('.controls aside p.selected').removeClass('selected');
        }	   
	   
        // Add selected class to summary item
		function selectSummaryItem(index)
		{
            $('.controls aside p:nth-child(' + index + ')').addClass('selected');
		}
		
    	// Touch start event handler
    	function touchStartHandler(e)
    	{
    		if (whoopingkof.isConnected() && e.changedTouches.length > 0)
    		{
    			var touch = e.touches[0];
    			touches[touch.identifier] = touch.pageY;
    		}
		}    	
		
    	// Touch end event handler
    	function touchEndHandler(e)
    	{
    		if (whoopingkof.isConnected() && e.changedTouches.length > 0)
    		{	
    			var length = e.changedTouches.length;
    			for (var i = 0; i < length; i++)
    			{
    				var touch = e.changedTouches[i];
    				if (touches[touch.identifier])
    				{
    					var distance = touch.pageY - touches[touch.identifier];
    					if (Math.abs(distance) >= swipeMin)
    					{
    						setLampPower(distance < 0);	
    					}
    					delete touches[touch.identifier];
    				}
    			}	
    		}
		}    	
		
	}
	
});
