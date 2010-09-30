$().ready(function() {
    // Initialize ID and name
    var defaultData = { 'name': '', 'history': [], 'unread': 0, color: '' };
    var id = '';
    var name = '';
    var users = {};
    var privateId = '';
    var globalId = 'GLOBAL';
    var hasHashChange = typeof window.onhashchange !== "undefined";
    var colors = ['green', 'blue', 'pink', 'yellow', 'orange', 'red', 'purple'];
	onDisconnect();
    
    // Initialize the background
    initializeBackground();
    
    // Hide the contain until the stored username is retrieved
    var $container = $('.container-chat').hide();
    window.$w.getData('nickname', function(doc) {
        if (doc && doc != null && doc != '')
        {
            name = doc;
            $('#nickname').val(name);
        }
        $container.show();    
    });    

    // Store state configuration information
    // Getter:  $.data(document.body, "config").chatScreenIndex
    $.data(document.body, "config", {
        chatScreenIndex: 0
    });

	// Hide the send message container
   	$('#send-message').hide();
	
    /*** whoopingkof event binding ***/

    whoopingkof.onConnect(onConnect);
    whoopingkof.onDisconnect(onDisconnect);
    whoopingkof.subscribe('identity', identifyHandler);
    whoopingkof.subscribe('connected disconnected', statusHandler);
    whoopingkof.subscribe('message', messageHandler);
    whoopingkof.subscribe('nickname', nicknameHandler);
    whoopingkof.subscribe('users', usersHandler);

    /*** whoopingkof event handlers ***/

    // onConnect handler
    function onConnect() 
    { 
        //Maybe some init stuff here?
    }

    // onDisconnect handler
    function onDisconnect() 
    {
        id = '';
        privateId = '';
        users = {};
        $('#chat-users-list ul').empty();
        clearMessages();
        updateHash();
    }
    
    // `identify` message handler
    function identifyHandler(message) {
        id = message.sender;
        sendNickname();
    }

    // `connected` and `disconnected` handler
    function statusHandler(message) {
        var isSender = message.sender == id;
        if (message.type == 'connected')
        {
            if (!isSender)
            {
                createUser(message.sender);
            }
        }
        else if (message.type == 'disconnected')
        {
            if (isSender)
            {
                // TODO: Do we need this?  onDisconnect should fire
//                onDisconnect();
            }
            else
            {
                removeUser(message.sender);
            }
        }
    }

    // `nickname` message handler
    function nicknameHandler(message)
    {
        if (message.sender == id)
        {
            updateHash('users');
        }
        else
        {
            createUser(message.sender);
            if (users[message.sender])
            {
                users[message.sender].name = message.data;
                updateList(message.sender);
            }
        }
    }

    // `users` message handler
    function usersHandler(message)
    {
        try
        {
            if (message.data && message.data.length)
            {
                var user;
                var index = 0;
                while ((user = message.data[index++]))
                {
                    if (user.id && user.id != '' && user.name && user.name != '')
                    {
                        createUser(user.id);
                        if (users[user.id])
                        {
                            users[user.id].name = user.name;
                            updateList(user.id);
                        }
                    }
                }
            }
        }
        catch (e)
        {
        }
    }
    
    // `message` message handler
    function messageHandler(message) {
    	var userId;
        if (message.to == '')
		{
			userId = globalId;
			message.to = globalId;
		}
    	else if (message.to == id)
    	{
    		userId = message.sender;
    	}
    	else if (message.sender == id)
    	{
    		userId = message.to;
    	}
    	if (userId)
    	{
    		var user = users[userId];
    		if (user)
    		{
    			user.history.push(message);
    			if (userId == privateId)
    			{
    				renderMessage(message);
    			}
    			else
    			{
	        		user.unread++;
	        		$('#u' + userId + ' em').text(user.unread).show();
    			}
    		}
    	}
    }


    /*** Helpers ***/

	// Create the background tile and set as body background image
	function initializeBackground()
	{
		var $canvas = $('<canvas width="21" height="21"></canvas>');
		if ($canvas.length == 1)
		{
			var canvas = $canvas.get(0);
			if (canvas && canvas.getContext)
			{
				var context = canvas.getContext('2d');
				context.strokeStyle = 'rgba(255, 255, 255, .6)';
				context.lineCap = 'square';
				context.lineWidth = 1;
				context.beginPath();
				context.moveTo(canvas.width, 0);
				context.lineTo(0, canvas.height);
				context.stroke();
				var data = canvas.toDataURL('image/png');
				if (window.$w.isInvalidDataURI(data))
				{
					data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAAd0lEQVQ4Ea3Uuw3AMAgEUJxhPJunSZ1tCRSOksgfPod0QqJ4uorCzAScKlY70KB4F2lTQKoYp0Q3wUEE+mmoYBYdghl0CkbRJRhBt6AXNYEe1AxaURdoQd3gDg2BKzQMztAUOELT4B+FgG8UBnYUCnb0+dh6QOQGKnK9TDnd3VQAAAAASUVORK5CYII=';
				}
				$('body').css('background-image', "url('" + data + "')");
			}
		}
	}

    // Create a user
    function createUser(userId)
    {
        if (userId != id && !users[userId])
        {
            if (!users[globalId])
            {
            	users[globalId] = $.extend(true, {}, defaultData, { name: 'All Users', id: globalId });
                updateList(globalId);
            }
            users[userId] = $.extend(true, {}, defaultData, { color: getUserColor() });
        }
    }

    // Remove a user
    function removeUser(userId)
    {
        if (userId != '' && users[userId])
        {
            delete users[userId];
            $('li #u' + userId).parent().remove();
        }
    }
    
    // Update a user in the list
    function updateList(userId)
    {
        if (userId != id && users[userId])
        {
            var name = users[userId].name;
            var listId = 'u' + userId;
            var $user = $('#' + listId);
            if ($user.length == 0)
            {
                $('<li><a href="#" id="' + listId + '">' + name + '<em></em></a></li>').hide().appendTo('#chat-users-list ul').fadeIn();
            }
            else
            {
                $user.text(name);
            }
        }
    }

    // Send a whoopingkof message
    function send(type, data, privateId)
    {
        if (whoopingkof.isConnected())
        {
            whoopingkof.dispatch(type, data, privateId);
            return true;
        }
        return false;
    }

    // Parse the user id from an element id
    function parseId(value)
    {
        return value.length > 1 ? value.substr(1) : '';
    }

    // Send the user's nickname
    function sendNickname()
    {
        if (id != '' && name != '')
        {
            return send('nickname', name);
        }
        return false;
    }

	// Store the nickname
	function storeNickname()
	{
        var nickname = $('#nickname').val();
        if (nickname && nickname != '')
        {
            name = nickname;
            window.$w.setData('nickname', name);
            if (whoopingkof.isConnected() && id != '')
            {
                sendNickname();
            }
            else
            {
                window.$w.connect({ 'port': 'chat' });
            }
        }
	}

    // Send the chat message
    function sendMessage(el) 
    {
        var $message = el || $('#message');
        var extension = {};
        var value = $message.val();
        if (value != '')
        {
	        if (send('message', value, privateId == globalId ? '' : privateId))
	        {
	            $message.val('');
	        }    
        }
        return false;
    }    
	
	// Render a message    
    function renderMessage(message)
    {
    	if (privateId != '')
    	{
    		var user = users[privateId];
    		if (user)
    		{
				var userName = '';
				var cssClass = '';
				if (message.sender == id && message.to == privateId)
				{
					userName = name;
					cssClass = 'self ' + colors[0];
				}
				else if (message.sender == privateId && message.to == id)
				{
					userName = user.name;
					cssClass = 'friend ' + user.color;
				}
				else if (message.to == globalId)
				{
					var sendUser = users[message.sender];
					if (sendUser)
					{
						userName = sendUser.name;
						cssClass = 'friend ' + sendUser.color;
					}
				}
				if (userName != '' && cssClass != '')
				{
					var height = $('#chat-log .messages-list').append('<blockquote class="' + cssClass + '">' + message.data + '</blockquote><p>' + userName + '</p>').outerHeight();
					$('#chat-log .messages-list-container').scrollTop(height);
				}
    		}
    	}
    }
    
    // Clear chat messages display
    function clearMessages()
    {
    	$('#chat-log .messages-list').empty();
    }
    
    // Update the window hash
    function updateHash(hash) 
    {
        hash = hash || '';
        window.location.hash = hash;
        if (!hasHashChange && typeof window.onhashchange === "function")
        {
        	window.onhashchange();
        }
    }

    // Check the window hash
    function checkHash() {
        var hash = location.hash.replace('#', '');
        if (hash == 'users')
        {
        	privateId = '';
            moveContainer({
                index: 1
            });
		}
		else if (hash == 'thread')
		{
			$('#message').val('');
			// TODO: Should we check for privateId and initialize messages here?
            moveContainer({
                index: 2
            });
        }
        else
        {
            moveContainer({
                index: 0
            });
        }
    }    
	
	// Update the chat index value
    function updateChatIndex(val) {
        $.data(document.body, 'config', $.extend($.data(document.body, "config"), {
            chatScreenIndex: val
        }));
        if (val == 2)
        {
        	$('#send-message').slideDown();
        	if (!window.$w.hasTouchSupport)
        	{
				$('#message').focus();
        	}
        }
        else
        {
        	$('#send-message').slideUp();
        	if (val == 0 && !window.$w.hasTouchSupport)
        	{
        		$('#nickname').focus();
        	}
        }
    }

	// Animate the content container
    function moveContainer(options) {
        var currentIndex = $.data(document.body, 'config').chatScreenIndex,
            leftValue = 0;

        if (options.index === currentIndex) return;

        // current is 0
        if (currentIndex === 0 && options.index === 1) leftValue = '-100%';
        if (currentIndex === 0 && options.index === 2) leftValue = '-200%';
        // current is 1
        if (currentIndex === 1 && options.index === 0) leftValue = '0%';
        if (currentIndex === 1 && options.index === 2) leftValue = '-200%';
        // current is 2
        if (currentIndex === 2 && options.index === 0) leftValue = '0%';
        if (currentIndex === 2 && options.index === 1) leftValue = '-100%';

		// Set the height of the log
		if (options.index == 2)
		{
			var $scroll = $('#chat-log .messages-list-container');
			$scroll.height($(window).height() - $('#send-message').outerHeight() - $scroll.offset().top);
		}

        $container.animate({
                left: leftValue
            }, 500, function() {
                updateChatIndex(options.index);
            });
	}
    
    // Generate a random number
	function generateRandom(min, max)
	{
		return min + Math.floor(Math.random() * (max + 1 - min));
	}		
    
    // Get random color for friend
    function getUserColor()
    {
    	var index = generateRandom(1, colors.length - 1);
    	return colors[index];
    }
    
    /*** Event handlers ***/
    
    // Set onhashchange handler
    window.onhashchange = checkHash;
    
    // Click handler for Connect button
    $('#store-nickname').bind(window.$w.clickEvent, function() {
    	storeNickname();
        return false;
    });

    // Send message when users clicks Send button
    $('#send').bind(window.$w.clickEvent, function(e) {
        sendMessage();
        return false;
    });

    // Send message when user presses enter
    $('#message').bind('keypress', function(e) {
        if (e.charCode == 13) 
        {
        	sendMessage();
            return false;
        }
    });
	
	// Send nickname when user presses enter
	$('#nickname').bind('keypress', function(e) {
        if (e.charCode == 13) 
        {
        	storeNickname();
        }
	});
	    
    // User list item click handler
    $('#chat-users-list ul li a').live(window.$w.clickEvent, function() {
    	if (privateId == '')
    	{
    		var userId = parseId($(this).attr('id'));
    		var user = users[userId];
    		if (user)
    		{
    			privateId = userId;
    			clearMessages();
    			$('#chat-log h3').text("Chatting with '" + user.name + "'");
	    		var index = 0;
	    		var message;
	    		while ((message = user.history[index++]))
	    		{
	    			renderMessage(message);
	    		}
	    		updateHash('thread');
    			user.unread = 0;
    			$('#u' + userId + ' em').text('').hide();
	   		}
    	}
        return false;
    });
	
});
