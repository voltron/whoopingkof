Adding an Extension to WhoopingKof Library
==========================================

Add method to IWhoopingkofExtensionJS.java.  
-------------------------------------------
<pre><code>
public interface IWhoopingkofExtensionJS {
	
	/**
	 * Enable a JS event
	 * 
	 * @param type	Event type
	 * @return	String containing registration data
	 */
	public String enableEvent(String type);
	
	/**
	 * Disable a JS event
	 * 
	 * @param type	Event type
	 */
	public void disableEvent(String type);
	
	/**
	 * Echo a new phrase.
	 * 
	 * @param word	The word to be appended to.
	 */
	public String say(String word);
	
}
</code></pre>

Implement method in WhoopingkofExtension.java.
----------------------------------------------
<pre><code>
public String say(String word){
	return word+ " from Java";
}
</code></pre>

In your JavaScript file, call method like so:
---------------------------------------------
<pre><code>
var text = window.WhoopingkofExt.say('foo from JavaScript again and also');
alert(text); // alerts "foo from JavaScript again and also from Java"
</code></pre>

If you want to be able to allow JavaScript to subscribe to the method (or event), change the method to executeJS() as opposed to just returning the value.
----------------------------------------------------------------------------------------------------------------------------------------------------------
<pre><code>
public String Bar(String word){
		
	this.executeJS("window.$w.dispatch('baz', 'hello from Java and " + word + "');");
	return "";  // Stil have to satisfy function signature, but this never "reaches" the JavaScript call.
}
</code></pre>

In your JavaScript file, subscribe like so:
-------------------------------------------
<pre><code>
window.$w.subscribe('baz', function(data) {
	if (data)
	{
		alert(data);
	}
});
	
window.WhoopingkofExt.Bar('from JavaScript too!');	// Will alert "hello from Java and from JavaScript too!"
</code></pre>