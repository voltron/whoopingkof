$(document).ready(function() {
	if (window)
	{
		var threshold = 5;
		var origin;
		var current;
		var isOn = false;
		
		// Update the distance threshold
		$('.destination .latitude, .destination .longitude, .current .latitude, .current .longitude, .distance .from-origin').html('n/a');
		$('.distance .threshold').html(threshold);
		
		// Get the stored origin		
		$w.getData('origin', updateOrigin);
		
		// Update the origin display
		function updateOrigin(data)
		{
			if (data)
			{
				origin = $.extend({}, data);
				$('.destination .latitude').html(origin.lat);
				$('.destination .longitude').html(origin.long);
				calculateDistance();
			}
		}
			
		// Calculate the distance from origin
		function calculateDistance()
		{
			if (origin && current)
			{
				console.log('origin.lat: ' + origin.lat + ', origin.long: ' + origin.long);
				console.log('current.lat: ' + current.lat + ', current.long: ' + current.long);
				var distance = window.WhoopingkofExt.distanceBetween(origin.lat, origin.long, current.lat, current.long);
				$('.distance .from-origin').html(distance);
				var inProximity = distance < threshold;
				$('.in-proximity').html(inProximity ? 'In Proximity' : 'Not in Proximity').css('color', inProximity ? '#0f0' : '#f00');
			}
		}
		
		$('.set-origin').parents('li').hide();
		$('.toggle-gps').bind(window.$w.clickEvent, function(e) {
			isOn = !isOn;
			if (isOn)
			{
				window.$w.subscribe('gps', gpsHandler);
				$('.set-origin').parents('li').show();
			}
			else
			{
				window.$w.unsubscribe('gps', gpsHandler);
				$('.set-origin').parents('li').hide();
			}
			$(this).text('Turn GPS ' + (isOn ? 'Off' : 'On'));
			return false;
		});
		
		// Add set origin click handler
		$('.set-origin').bind(window.$w.clickEvent, function(e) {
			if (current)
			{
				var location = $.extend({}, current);
				$w.setData('origin', $.extend({}, current), function(data) {
					if (data && data != null)
					{
						updateOrigin(location);
					}
				})
			}
			return false;
		});

		// Handle GPS data
		function gpsHandler(data) {
			if (data)
			{
				current = $.extend({}, data);
				$('.current .latitude').html(current.lat);
				$('.current .longitude').html(current.long);
				calculateDistance();
			}
		};
		
		// Call menu function with options object passed in.
		var options = {
			cells: 
			[
				{
					label: 'Option 1',
					iconClass: 'menu-icon-globe', 
					handler: function(){
						alert('option one was pressed!')
						return false;
					}
				},
				{	
					label: 'Option 2', 
					iconClass: 'menu-icon-disc', 
					handler: function(){
						alert('option two was pressed!')						
						return false;
					}
				},
				{
					label: 'Option 3', 
					iconClass: 'menu-icon-cloud', 
					handler: function(){
						alert('option three was pressed!')											
						return false;
					}
				}
			],
			bottom: true,
			rows: false
		};
		
		var optionsTop = {
			cells: 
			[
				{
					label: 'Option 1',
					iconClass: 'menu-icon-flash', 
					handler: function(){
						alert('option one was pressed!')
						return false;
					}
				},
				{	
					label: 'Option 2', 
					iconClass: 'menu-icon-dialog', 
					handler: function(){
						alert('option two was pressed!')						
						return false;
					}
				},
				{
					label: 'Option 3', 
					iconClass: 'menu-icon-sun', 
					handler: function(){
						alert('option three was pressed!')											
						return false;
					}
				},
					{
						label: 'Option 4', 
						iconClass: 'menu-icon-monitor', 
						handler: function(){
							alert('option four was pressed!')											
							return false;
						}
				}
			],
			bottom: false,
			rows: false
		};
		
		
		window.$w.subscribe('menu', function(){
			window.$w.toggleMenu();
			//alert('Menu button pressed');
		});

		window.$w.customMenu(options);
		window.$w.customMenu(optionsTop);
	
		
		setTimeout(function(){
			//window.$w.dispatch('menu');
		},150)

	}
	
});
