;try
{
    if (!window.$w && window.whoopingkof)
    {
        (function(window)
        {
            // Create the $w object
            var $w = function(window)
            {
                // Initialize user agent and touch support flags
                this.isIPhone = navigator.userAgent.indexOf('iPhone') != -1;
                this.isIPod = navigator.userAgent.indexOf('iPod') != -1;
                this.isIPad = navigator.userAgent.indexOf('iPad') != -1;
                this.isAndroid = navigator.userAgent.indexOf('Android') != -1;
                this.hasTouchSupport = this.isIPhone || this.isIPod || this.isIPad || this.isAndroid;
                this.clickEvent = this.hasTouchEvent ? 'tap' : 'click';
                this.preventTouchEventDefault = true;
                this.stopTouchEventPropagation = true;
                
                // Initialize the database
                var db = null;
                if (window.Lawnchair)
                {
                    db = new window.Lawnchair('whoopingkof');
                }
                
                // Dispose of the object
                this.dispose = function()
                {
                    events.dispose();
                    var type;
                    while (subscribed.length > 0)
                    {
                        var type = subscribed.shift();
                        if (window.WhoopingkofExt)
                        {
                            window.WhoopingkofExt.disableEvent(type);
                        }
                    }
                };

                // Debugging method to clear local DB
                this.clearData = function()
                {
                    if (db !== null)
                    {
                        db.nuke();
                    }
                };

                // Expose method to get data
                this.getData = function(key, handler)
                {
                    if (db !== null)
                    {
                        db.get(key, function(doc) {
                            dbCallback(doc, handler);
                        });
                    }
                    else if (typeof(handler) == "function")
                    {
                        handler(null);
                    }
                };
                
                // Expose method to store data
                this.setData = function(key, value, handler)
                {
                    if (db !== null)
                    {
                        var payload;
                        if (typeof(value) == "object")
                        {
                            payload = value;
                        }
                        else
                        {
                            payload = { '__data__': value };
                        }
                        payload.key = key;
                        db.save(payload, function(doc) {
                            dbCallback(doc, handler);
                        });        
                    }
                };
				
				// getData and setData callback
                function dbCallback(doc, handler)
                {
                    var hasHandler = typeof(handler) == "function";
                    if (doc)
                    {
                        if (doc.__data__)
                        {
                            if (hasHandler)
                            {
                                handler(doc.__data__);
                            }    
                        }
                        else
                        {
                            delete doc.key;
                            if (hasHandler)
                            {
                                handler(doc);
                            }
                        }
                    }
                    else if (hasHandler)
                    {
                        handler(null);
                    }
                }
            
                // Store the whoopingkof uris
                var uris = {};
                
                // Save the whoopingkof URI
                this.saveConnectionInfo = function(host, broadcastPort, chatPort, gamePort, handler)
                {
                    if (host && broadcastPort && chatPort)
                    {
                        var index = host.indexOf('://');
                        if (index !== -1)
                        {
                            host = host.substring(index + 3);
                        }
                        index = host.lastIndexOf(':');
                        if (index !== -1)
                        {
                            host = host.substring(0, index -1);
                        }
                        broadcastPort = parseInt(broadcastPort);
                        chatPort = parseInt(chatPort);
                        gamePort = parseInt(gamePort);
                        if (host != '' && !isNaN(broadcastPort) && !isNaN(chatPort) && !isNaN(gamePort) && broadcastPort != chatPort && broadcastPort != gamePort && chatPort != gamePort)
                        {
                            uri = {};
                            this.setData('ws', { 'host': host, 'broadcast': broadcastPort, 'chat': chatPort, 'game': gamePort }, handler);
                        }
                    }
                };
                
                // Connection options
                var connectionOptions = { 'port': 'broadcast', 'ping': 60000 };
                
                // Establish a connection
                this.connect = function(options, handler)
                {
                	var options = $.extend({}, connectionOptions, options);
                	var uri = uris[options.port];
                    if (uri)
                    {
                        whoopingkof.connect(uri);
                        if (typeof(handler) == "function")
                        {
                            handler();
                        }
                    }
                    else
                    {
                        this.getData('ws', function(doc) {
                            if (doc && doc.host && doc[options.port])
                            {
                                uri = 'ws://' + doc.host + ':' + doc[options.port] + '/';
                                uris[options.port] = uri;
                                window.whoopingkof.connect(uri, options.ping);
                                if (typeof(handler) == "function")
                                {
                                    handler();
                                }
                            }
                        });
                    }
                };
                
                this.customMenu = function(options)
                {
                        // TODO: check for required options or set them.
                        var rows = (options.rows) ? true : false;
                        
                        var menuClass = options.bottom ? 'custom-menu-bottom' : 'custom-menu-top';
                        var menuHtml = "<div class='container-custom-menu "+menuClass+"'>";
                        var cellsHtml = '';
                        var numLabels = options.cells.length;
                        
                        for(i=0; i<numLabels; i++)
                        {
                            // Check for icon class and add it if there.
                            var icon = options.cells[i].iconClass ? options.cells[i].iconClass : '';
							var customHtml = options.cells[i].customHtml || null;
							var closing = !!customHtml ? customHtml+"</div>" : "</div>";
							var customRow = !!customHtml ? 'custom-row' : '';
							
							if(!options.cells[i].label)
							{
	                            cellsHtml += "<div class='container-menu-cell " +customRow+ "'>"
									+ closing;
							}
							else
							{
    	                        cellsHtml += "<div class='container-menu-cell " +customRow+ "'><span class='menu-label "+ icon + "'>"
									+ options.cells[i].label + "</span>"
									+ closing;
							}

                        }
                        
                        menuHtml += cellsHtml + "</div>";
                        
                        // Let's persist it.
                        $.data(document.body, 'menuState', false);
                        
                        var menuParent = $(menuHtml).appendTo(document.body);

                        if(rows){
                            var cellStyle = { 
                                width: '98%'
                            };
                        }
                        else
                        {
                            var cellStyle = { 
                                width: 98/numLabels+'%'
                            };
                        }
						
                        menuParent.children('div')
                            .css(cellStyle)
							.end()
							.children('div:not(.custom-row)')
                            .each(function(i,el){
                                $(el).bind(window.$w.clickEvent, options.cells[i].handler);
                            });                        
                }
                
                this.toggleMenu = function()
                {
                    var state = !$.data(document.body, 'menuState');
                    animateMenu(state) ;
                    $.data(document.body, 'menuState', state);
                }

                this.isMenuOpen = function()
                {
                	return $.data(document.body, 'menuState') === true;
                }
                
                var $wrapper = $('.wrapper');
                
                function bindMenuBlur()
                {                    
                    $wrapper.live(window.$w.clickEvent, function(e){
                        if($(e.target).hasClass('menu-label') || $(e.target).hasClass('custom')) {
                            return false;
                        }
                        this.toggleMenu();
                        return false;
                    });
                }

                function unbindMenuBlur()
                {
                    $wrapper.die(window.$w.clickEvent);                    
                }
                
                function animateMenu(bool)
                {
                    bool ? bindMenuBlur() : unbindMenuBlur();
                    $(".container-custom-menu").each(function (index, el) {
                        var viz = (bool ? 'block' : 'none');
                        bool && (this.style.display = viz);
                        $(this).stop().animate( {"opacity": (bool ? 1 : 0) }, 400, function(){
                            !bool && (this.style.display = viz);
                        });
                    });
                }
                
                // Check if a value exists in an array
                function inArray(haystack, needle)
                {
                    var length = haystack.length;
                    for (var i = 0; i < length; i++)
                    {
                        if (haystack[i] == needle)
                        {
                            return i;
                        }
                    }
                    return -1;    
                };
                
                // Create the events module
                var events = new window.whoopingkof.events();
                
                // Subscribe an event handler
                this.subscribe = function(types, handler)
                {
                    if (events.subscribe(types, handler))
                    {
                        processEvents(types, handler);
                    }
                };
                
                // Unsubscribe an event handler
                this.unsubscribe = function(types, handler)
                {
                    if (events.unsubscribe(types, handler))
                    {                        
                        processEvents(types);
                    }
                };
                
                // Dispatch an event
                this.dispatch = function(types, data, parseJSON)
                {
                    parseJSON = parseJSON || false;
                    if (data != "" && parseJSON == true)
                    {
                        data = JSON.parse(data);
                    }
                    events.dispatch(types, data);
                };
                
                // Store the currently subscribed events
                var subscribed = [];
            
                // Process the subscribed / unsubscribed events for custom logic
                function processEvents(types, handler)
                {
                    types = types.split(" ");
                    var type;
                    var index = 0;
                    var isHandler = handler && typeof(handler) == "function";
                    while ((type = types[index++]))
                    {
                        var isSubscribed = events.isSubscribed(type);
                        var index = inArray(subscribed, type);
                        var wasSubscribed = index !== -1;
                        if (isSubscribed != wasSubscribed)
                        {
                            
                            if (isSubscribed)
                            {
                                subscribed.push(type);    
                                if (window.WhoopingkofExt)
                                {
                                    var data = window.WhoopingkofExt.enableEvent(type);
                                    if (data != "" && isHandler)
                                    {
                                        handler(JSON.parse(data));
                                    }
                                }
                            }
                            else
                            {
                                subscribed.splice(index, 1);
                                if (window.WhoopingkofExt)
                                {
                                    window.WhoopingkofExt.disableEvent(type);
                                }
                            }
                        }
                    }
                }

				// Add global touch handlers
				if (this.hasTouchSupport)
				{
					document.addEventListener('touchend', touchEndHandler, false);
				}	            

		    	// Touch end event handler
		    	function touchEndHandler(e)
		    	{
					var length = e.changedTouches.length;
					for (var i = 0; i < length; i++)
					{
						var touch = e.changedTouches[i];
						var $target = $(touch.target);
						if ($target.length == 1)
						{
							var offset = $target.offset();
							if (touch.pageX >= offset.left && touch.pageX <= offset.left + $target.outerWidth() && touch.pageY >= offset.top && touch.pageY <= offset.top + $target.outerHeight())
							{
								if (this.preventTouchEventDefault)
								{
									e.preventDefault();
								}
								if (this.stopTouchEventPropagation)
								{
									e.stopPropagation();
								}
								touch.type = 'tap';
								$target.trigger(new jQuery.Event(touch));
							}
						}
					}
					return false;
				}

	            // Check if an invalid data URI
	            this.isInvalidDataURI = function(data)
	            {
	            	return data == 'data:,';
	            };
							
            };
            
            // Assign to the window
            window.$w = new $w(window);
            // Assign window unload event handler to unsubscribe handlers                    
            window.onunload = function(){
                 window.$w.dispose();
            };
            
        })(window);        
    }
}
catch (e)
{
    if (window.console && window.console.log)
    {
        window.console.log('error: ' + e);
    }
    else
    {
        alert('error: ' + e);
    }
}

$(function(){
	$(window).bind('resize', function(e) {
	    // In order for menu blur click handler to work we need to force the size of the wrapper.
	    $('.wrapper').height(window.innerHeight+'px');    
	});
	$(window).resize();
	
	// Just a simple keyboard entry easter egg plugin.
	// The default is pressing the space bar 3 times.
	(function($) {

	    $.fn.egg = function(callback, code) {
	        if(code == undefined) code = "32,32,32"; // three spaces.

	        return this.each(function() {
	            var kkeys = [];
	            $(this).keydown(function(e){
	                kkeys.push( e.keyCode );
	                if ( kkeys.toString().indexOf( code ) >= 0 ){
						// Reset the array.
						kkeys = [];
	                    callback(e);
	                }
	            }, true);
	        });
	    }

	})(jQuery);
	
	$(window).egg(function(){
		window.$w.dispatch('menu');
	});
	
});