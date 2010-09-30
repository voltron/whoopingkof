Adding an Extension
===================

Create Interface ( IFooJS.java ).  Add methods that will only be exposed to window object in WebView.
-----------------------------------------------------------------------------------------------------
<pre><code>
public interface IFooJS { 
	public String say(String word);
}
</code></pre>

Create Class Implementation ( Foo.java ).  Implement methods of interface and extend WebExtension abstract fbase class.
--------------------------------------------------------------------------------------------------------------------------
<pre><code>public class Foo extends WebViewExtension implements IFooJS{}</code></pre>

Constructor of class must pass in the activity's context and the webview instance.
-----------------------------------------------------------------------------------------------------
<pre><code>	
public Foo(Context context, WebView webView) {
	super(context, webView);
				
	// Add JS interface
	// Cast to IFooJS to only expose methods from the interface.
	webView.addJavascriptInterface((IFooJS)this, "Foo");
}
</code></pre>

Implement interface methods in class definition.
------------------------------------------------
<pre><code>
public String say(String word){
	return word+ " from Java";
}
</code></pre>

In App.java (main app file), import your extension and create an arraylist of extensions and add your extension to the list inside the activity.
---------------------------------------------------------------------------------------------------------------------------------------------------
<pre><code>

import com.myapp.foo;

/* In activity */
private ArrayList<IWebViewExtension> extensions = new ArrayList<IWebViewExtension>();

/* ... deeper in activity ... */

extensions.add(new Foo(this, webView));

</code></pre>

In your JavaScript file, call method like so:
---------------------------------------------
<pre><code>
var text = window.Foo.say('text from JavaScript and also ');
alert(text); // alerts "text from JavaScript and also from Java"
</code></pre>