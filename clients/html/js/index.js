var locale = {};


$(function(){

	if(window.location.hostname === 'localhost')
	{
		document.getElementById('uri').value = 'ws://127.0.0.1'
	}
	
	$('#game-port').parent('div').hide();

	// Do stuff for orientation change event.
	var supportsOrientationChange = "onorientationchange" in window;
    var orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
	
	window.addEventListener(orientationEvent, function() {
		
		if(supportsOrientationChange)
		{
			if(orientation === 90)
			{
			// Landscape
			}	
			else	
			{
			// Portrait
			}

		}
	}, false);

	// Android WebView has window.screen.height & window.screen.height, iPhone does not.

	// Event handlers.
	function onHashChangeHandler (event) {
		if(location.hash === '#apps-list')
		{
			toggleApps(true);	
		}
		else toggleApps(false);
    }
    
    // Handle hashchange events.
    // Check it Onload as well.
    onHashChangeHandler();
    
    window.addEventListener("hashchange", onHashChangeHandler, false);
	
	function toggleApps(flag){
	
		if(flag)
		{
			$('#store-uri').addClass('hide');
			$('#list-apps').removeClass('hide');
			location.hash = '#apps-list';
		}
		else
		{
			$('#list-apps').addClass('hide');
			$('#store-uri').removeClass('hide');
		}
	}
	
	$('#store').bind(window.$w.clickEvent, function(e)
	{
		var host = $("#uri").val();
		var broadcastPort = $('#broadcast-port').val();		
		var chatPort = $('#chat-port').val();		
		var gamePort = $('#game-port').val();
		if (host && broadcastPort && chatPort && gamePort)
		{
			// Store the data
			window.$w.saveConnectionInfo(host, broadcastPort, chatPort, gamePort, function() {
				$('#store-uri').fadeOut(350, function(){
					$('#list-apps').fadeIn();
					location.hash = '#apps-list';
				});	
			});
		}
		return false;
	});

		// Call menu function with options object passed in.
		var options = {
			cells: 
			[
				{
					label: 'Proximity',
					iconClass: '', 
					handler: function(){
						window.$w.toggleMenu();
						window.location.href = 'proximity.html';
						return false;
					}
				}
			],
			bottom: true,
			rows: false
		};
		
		window.$w.subscribe('menu', function(){
			window.$w.toggleMenu();
		});

	window.$w.customMenu(options);

	
	setTimeout(function(){
	// For testing purposes
	//	window.$w.dispatch('menu');
	},150)


	
});
