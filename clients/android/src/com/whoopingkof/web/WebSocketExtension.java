package com.whoopingkof.web;

import java.nio.channels.NotYetConnectedException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map.Entry;

import com.sigi.AbstractWebViewExtension;
import com.whoopingkof.net.WebSocket;
import com.whoopingkof.net.WebSocketListener;

import android.util.Log;

public final class WebSocketExtension extends AbstractWebViewExtension implements WebSocketExtensionJS,
		WebSocketListener {

	// --------------------------------------------------
	// Private Fields
	// --------------------------------------------------

	/**
	 * Collection of active WebSockets and JS client IDs
	 */
	private HashMap<String, WebSocket> webSockets;

	// --------------------------------------------------
	// Constructor
	// --------------------------------------------------

	/**
	 * Constructor
	 */
	public WebSocketExtension() {
		super();

		// Set the WebViewClient to load web socket script
		/*
		 * final WebSocketExtension self = this; webView.setWebViewClient(new
		 * WebViewClient() {
		 * 
		 * @Override public void onPageFinished(WebView view, String url) { //
		 * Inject websocket.js into documentself.executeJS(
		 * "(function(){ var head = (document.getElementsByTagName('head')[0] || document.documentElement); var script = document.createElement('script'); script.src = 'file:///android_asset/websocket.js'; script.type = 'text/javascript'; head.insertBefore(script, head.firstChild); alert(head.innerHTML); })()"
		 * ); }
		 * 
		 * @Override public void onReceivedError(WebView view, int errorCode,
		 * String description, String failingUrl) { Log.d("WebSocket",
		 * failingUrl + " -> " + description); } });
		 */
	}

	// --------------------------------------------------
	// Public Methods
	// --------------------------------------------------

	/**
	 * Initialize the extension
	 */
	@Override
	public void initialize()
	{
		// Initialize fields
		this.webSockets = new HashMap<String, WebSocket>();
		// Add JS interface
		webView.addJavascriptInterface((WebSocketExtensionJS) this, "WebSocketExt");
	}
	
	/*
	 * Close all open sockets
	 */
	public void closeAll() {
		Iterator<Entry<String, WebSocket>> iterator = this.webSockets
				.entrySet().iterator();
		while (iterator.hasNext()) {
			this.close(iterator.next().getKey());
		}
	}

	/**
	 * Open a new WebSocket instance
	 */
	public String open(String uri, String subProtocol) {
		try {
			// Create the WebSocket and set the listener
			WebSocket webSocket = new WebSocket(uri, subProtocol);
			webSocket.setListener(this);
			// Store the WebSocket within the collection
			this.webSockets.put(webSocket.getId(), webSocket);
			// Open the WebSocket and return the ID
			webSocket.open();
			return webSocket.getId();
		} catch (IllegalArgumentException ex) {
		}
		return "";
	}

	/**
	 * Close a WebSocket instance
	 * 
	 * @param id
	 *            WebSocket id
	 */
	public void close(String id) {
		try {
			// Check if the WebSocket is valid
			if (this.webSockets.containsKey(id)) {
				if (this.webSockets.get(id) instanceof WebSocket) {
					// Close the WebSocket
					this.webSockets.get(id).close();
				}
				// Remove the WebSocket from the collection
				this.webSockets.remove(id);
			}
		} catch (Exception ex) {
		}
	}

	/**
	 * Send a WebSocket message
	 * 
	 * @param id
	 *            WebSocket ID
	 * @param message
	 *            Data to send
	 * @return True for success, False for error
	 */
	public Boolean send(String id, String data) {
		// Check if the WebSocket is valid
		if (this.webSockets.containsKey(id)
				&& this.webSockets.get(id) instanceof WebSocket) {
			try {
				// Send the data
				this.webSockets.get(id).send(data);
				return true;
			} catch (IllegalArgumentException ex) {
			} catch (NotYetConnectedException ex) {
			}
		}
		return false;
	}

	/**
	 * Handle application pause
	 */
	public void onPause(){
		// TODO: Capture current page (the html file) and 'save' it.
		try {
			this.closeAll();
		} catch (Exception ex) {
		}
	}
	
	/**
	 * Handle application resume
	 */
	public void onResume() {
		// TODO: loadurl(the saved page from onPause().
	}
	
	// --------------------------------------------------
	// WebSocketListener Interface
	// --------------------------------------------------

	/**
	 * Called when a WebSocket connection has been established
	 * 
	 * @param ws
	 *            WebSocket instance
	 */
	public void onOpen(WebSocket ws) {
		Log.d("WebSocket", "onOpen");
		// Call JS and notify of onOpen
		this.executeJS("window.WebSocket.onOpen(\"" + ws.getId() + "\")");
	}

	/**
	 * Called when a WebSocket connection has been terminated
	 * 
	 * @param ws
	 *            WebSocket instance
	 */
	public void onClose(WebSocket ws) {
		Log.d("WebSocket", "onClose");
		// Call JS and notify of onClose
		this.executeJS("window.WebSocket.onClose(\"" + ws.getId() + "\")");
	}

	/**
	 * Called when a WebSocket connection has received a message
	 * 
	 * @param ws
	 *            WebSocket instance
	 * @param message
	 *            Message received
	 */
	public void onMessage(WebSocket ws, String message) {
		Log.d("WebSocket", "onMessage: " + message);
		// Call JS an notify of onMessage
		message = message.replace("\"", "\\\"");
		this.executeJS("window.WebSocket.onMessage(\"" + ws.getId() + "\", \""
				+ message + "\")");
	}

}
