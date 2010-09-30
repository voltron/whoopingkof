Creating a Sigi Application
===========================

Create a new activity and change the class definition so it extends com.sigi.Sigi, not Activity.

Update the AndroidManifest.xml to include the following on the activity:

<pre><code>
android:screenOrientation="portrait" android:configChanges="orientation"
</code></pre>