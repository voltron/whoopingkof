$().ready(function() {
	var interval, index, message;

    whoopingkof.onConnect(onConnect);
    whoopingkof.onDisconnect(onDisconnect);
	window.$w.connect(); // whoopingkof.connect(uri, ping);

    function onConnect() 
    { 
		whoopingkof.dispatch('lampnofade');
		whoopingkof.dispatch('lampon');
		whoopingkof.dispatch('lampcolor', { 'h': 0, 's': 0, 'b': 100 } );		
    	whoopingkof.dispatch('lampoff');
    	setMessage('...---...');
    	interval = setInterval(sendCode, 1200 / 5); // Farnsworth speed (wpm) = 4
    }

    function onDisconnect() 
    {
    	clearInterval(interval);
    	$("body").css("background-color", "#000");
    }
    
    function setMessage(msg)
    {
    	index = -1;
    	message = [];
    	var length = msg.length;
    	for (var i = 0; i < msg.length; i++)
    	{
    		var c = msg.charAt(i);
    		if (c == '.')
    		{
    			message.push(true, false);
    		}
    		else if (c == '-')
    		{
    			message.push(true, true, true, false);
    		}
    	}
    }
    
    function sendCode() 
    {
    	index++;
    	if (index == message.length) 
    	{
    		index = -1;
    	}
    	var on = index > -1 && message[index];
    	whoopingkof.dispatch(on ? 'lampon' : 'lampoff');
    	$("body").css("background-color", on ? "#fff" : "#000");
    }

});
