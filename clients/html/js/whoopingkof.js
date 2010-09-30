;try
{
    if (!window.whoopingkof)
    {
        (function(window)
        {
            // Create the whoopingkof object
            var whoopingkof = function(window)
            {
                // WebSocket instance
                var ws = null;
                
                // onConnect callback
                var connectCallback;
                
                // onDisconnect callback
                var disconnectCallback;
                
                // Ping interval
                var interval = null;
                
                // Return connected status
                this.isConnected = function()
                {
                    return ws !== null;
                };
                
                // Set the onConnect listener
                this.onConnect = function(handler)
                {
                    connectCallback = handler;
                };
                
                // Set the onDisconnect listener
                this.onDisconnect = function(handler)
                {
                    disconnectCallback = handler;
                };
                
                // Connect to the whoopingkof service
                this.connect = function(uri, pingInterval)
                {
                    if (window.WebSocket && ws === null)
                    {
                        try
                        {
                            ws = new WebSocket(uri);
                            ws.onopen = openHandler;
                            ws.onclose = closeHandler;
                            ws.onmessage = messageHandler;
                            if (pingInterval > 0 && interval === null)
                            {
                            	interval = setInterval(pingSocket, pingInterval);
                            }
                            return true;
                        }
                        catch (e)
                        {
                            console.log('ERROR: ' + e);
                            closeHandler();
                        }
                    }
                    return false;
                };
                
                // Disconnect from the whoopingkof service
                this.disconnect = function()
                {
                    if (ws !== null)
                    {
                        ws.close();
                        return true;
                    }
                    return false;
                };
                
                // Subscribe to an events
                this.subscribe = function(types, handler)
                {
                    return events.subscribe(types, handler);
                };
                                
                // Unsubscribe to an event
                this.unsubscribe = function(types, handler)
                {
                    return events.unsubscribe(types, handler);
                };
                                
                // Dispatch an event
                this.dispatch = function(type, data, privateId)
                {
                    if (ws !== null && type !== null && type != "" && data !== null)
                    {
                        var message = { 'type': type, 'data': data };
                        if (privateId && privateId != null && privateId != '')
						{
							message['to'] = privateId;
						}
                        ws.send(JSON.stringify(message));
                        return true;
                    }
                    return false;
                };
                
                // WebSocket ping
                function pingSocket() 
                {
                	try
                	{
                		if (ws !== null)
                		{
                			ws.send('{ "type": "ping" }');
                		}
                	}
                	catch (e)
                	{
                	}
                }
                
                // WebSocket.onopen handler
                function openHandler()
                {
                    if (typeof(connectCallback) == "function")
                    {
                        connectCallback();
                    }
                }
                
                // WebSocket.onclose handler
                function closeHandler()
                {
                	if (interval !== null)
                	{
                		clearInterval(interval);
                		interval = null;
                	}
                    ws = null;
                    if (typeof(disconnectCallback) == "function")
                    {
                        disconnectCallback();
                    }
                }
                
                // WebSocket.onmessage handler
                function messageHandler(event)
                {
                    try
                    {
                        var data = JSON.parse(event.data);
                        if (data['type'] != undefined && data['sender'] != undefined)
                        {
                            events.dispatch(data['type'], data);
                        }
                    }
                    catch (e)
                    {
                    }
                }

                // Add the event engine
                var events = new whoopingkof.events();
                
            };
            whoopingkof.events = function()
            {
                // Event id
                var id = 0;
                
                // Event handlers
                var events = {};
                
                // Subscribe an event handler
                this.subscribe = function(types, handler)
                {
                    var result = false;
                    types = types.split(" ");
                    var type;
                    var index = 0;
                    while ((type = types[index++]))
                    {
                        if (!events[type])
                        {
                            events[type] = [];
                        }
                        if (!handler.eventId)
                        {
                            handler.eventId = "handler" + id++;
                        }
                        events[type].push(handler);
                        result = true;
                    }
                    return result;
                };
                
                // Unsubscribe an event handler
                this.unsubscribe = function(types, handler)
                {
                    var result = false;
                    var all = !handler || (handler && typeof(handler) == "function");
                    types = types.split(" ");
                    var type;
                    var index = 0;
                    while ((type = types[index++]))
                    {
                        var handlers = events[types];
                        var i = 0;
                        while (i < handlers.length)
                        {
                            if (all || handlers[i].eventId === handler.eventId)
                            {
                                handlers.splice(i, 1);
                                result = true;
                            }
                            else
                            {
                                i++;
                            }
                        }
                    }
                    return result;
                };
                
                // Dispatch an event
                this.dispatch = function(types, data)
                {
                    var result = false;
                    types = types.split(" ");
                    var type;
                    var index = 0;
                    while ((type = types[index++]))
                    {
                        var handlers = events[type];
                        if (handlers && handlers.length)
                        {
	                        var i = 0;
	                        while (i < handlers.length)
	                        {
	                            if (typeof(typeof(handlers[i]) == "function"))
	                            {
	                                handlers[i](data);
	                                i++;
	                                result = true;
	                            }
	                            else
	                            {
	                                handlers.splice(i, 1);
	                            }
	                        }
                        }
                    }
                    return result;
                };
                
                // Check if event handler(s) are subscribed for an event type
                this.isSubscribed = function(type)
                {
                    var handlers = events[type];
                    if (handlers)
                    {
                        return handlers.length > 0;
                    }
                    return false;
                };
                
                // Dispose of event handlers
                this.dispose = function()
                {
                    events = {};
                };
                
            };
            
            // Assign to the window
            window.whoopingkof = new whoopingkof(window);
            window.whoopingkof.events = whoopingkof.events;
            
            // Assign window unload event handler to disconnect connections                        
            window.onunload = function(){
                 window.whoopingkof.disconnect();
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
