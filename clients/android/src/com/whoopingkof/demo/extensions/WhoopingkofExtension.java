package com.whoopingkof.demo.extensions;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.binary.StringUtils;

import com.sigi.AbstractWebViewExtension;
import com.sigi.MenuDelegate;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Picture;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.location.LocationProvider;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;

public class WhoopingkofExtension extends AbstractWebViewExtension implements WhoopingkofExtensionJS, MenuDelegate, LocationListener {

	// --------------------------------------------------
	// Private Static Members
	// --------------------------------------------------

	// Location provide
	private static String LOCATION_PROVIDER = LocationManager.GPS_PROVIDER;
	
	// Location interval
	private static int LOCATION_INTERVAL = 0;
	
	// Minimum distance (meters) to notify of location change
	private static float LOCATION_MIN_DISTANCE = 0.5f;
	
	// Select picture request code
	private static final int SELECT_PICTURE = 1;
	
	// Send email request code
	private static final int SEND_EMAIL = 2;

	// --------------------------------------------------
	// Private Members
	// --------------------------------------------------

	// LocationManager instance
	private LocationManager locationManager;
	
	// Last location
	private Location currentLocation;
	
	// GPS active flag
	private Boolean isActiveGps = false;
	
	// Menu button capture code
	private Boolean isCapturingMenu = false;
		
	// --------------------------------------------------
	// Constructor
	// --------------------------------------------------

	/**
	 * Constructor
	 * 
	 * @param context	Context instance
	 * @param webView	WebView instance to add Whoopingkof support to
	 */
	public WhoopingkofExtension() {
		super();
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
		// Create the location manager
		locationManager = (LocationManager)this.sigi.getSystemService(Context.LOCATION_SERVICE);
		currentLocation = locationManager.getLastKnownLocation(LOCATION_PROVIDER);
		
		// Add JS interface
		webView.addJavascriptInterface((WhoopingkofExtensionJS) this, "WhoopingkofExt");
	}
	
	/**
	 * Enable a JS event
	 * 
	 * @param type	Event type
	 */
	public String enableEvent(String type) {
		Log.d("WhoopingkofExtension", "enableEvent: " + type);
		type = type.toLowerCase().trim();
		if (type.equals("gps"))
		{
			if (!isActiveGps)
			{
				isActiveGps = true;
				startLocationUpdates();		
			}
			return generateLocationData(currentLocation);
		}
		else if (type.equals("menu"))
		{
			isCapturingMenu = true;
		}
		return "";
	}
	
	/**
	 * Disable a JS event
	 * 
	 * @param type	Event type
	 */
	public void disableEvent(String type) {
		Log.d("WhoopingkofExtension", "disableEvent: " + type);
		type = type.toLowerCase().trim();
		if (type.equals("gps"))
		{
			if (isActiveGps)
			{
				stopLocationUpdates();
				isActiveGps = false;
			}
		}
		else if (type.equals("menu"))
		{
			isCapturingMenu = false;
		}
	}
	
	/**
	 * Calculate the distance between two points
	 * 
	 * @param startLatitude		Starting latitude 
	 * @param startLongitude	Starting longitude
	 * @param endLatitude		Ending latitude
	 * @param endLongitude		Ending longitude
	 * @return	Distance in meters
	 */
	public double distanceBetween(String startLatitude, String startLongitude, String endLatitude, String endLongitude)
	{
		float[] results = new float[1];
		try {
			Location.distanceBetween(Double.parseDouble(startLatitude), Double.parseDouble(startLongitude), Double.parseDouble(endLatitude), Double.parseDouble(endLongitude), results);
			return results[0];
		} catch (IllegalArgumentException ex) {
		}
		catch (Exception ex)
		{
		}
		return 0;
	}
	
	/**
	 * Select a picture from the gallery
	 */
	public void selectPicture()
	{
		Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
		intent.setType("image/*");
		this.sigi.executeIntent(this, Intent.createChooser(intent, "Select a Picture"), WhoopingkofExtension.SELECT_PICTURE);
	}
	
	/**
	 * Capture the WebView as a data URI
	 * 
	 * @return	Base64 encoded PNG
	 */
	public String captureAsDataURI()
	{
		return new String(Base64.encodeBase64(captureScreen()));
	}
	
	/**
	 * Capture the WebView and save PNG as a file
	 * 
	 * @return	File instance of saved file
	 */
	public File captureAsFile()
	{
		return captureAsFile("webview_" + System.currentTimeMillis() + ".png");
	}
	
	/**
	 * Capture the WebView and save PNG as a file
	 * 
	 * @param	filename	Filename of PNG to save
	 * @return	File instance of saved file
	 */
	public File captureAsFile(String filename)
	{
		FileOutputStream fileStream = null;
        try 
        {
        	// Create directory if it does not exist
        	File directory = new File(Environment.getExternalStorageDirectory().getAbsolutePath() + "/whoopingkof/");
        	directory.mkdirs();
        	File file = new File(directory, filename);
			// Write the captured screen (as PNG) to the SD card
        	fileStream = new FileOutputStream(file);
            if (fileStream != null)
            {
            	fileStream.write(captureScreen());
            	fileStream.close();
            	return file;
            }
        } 
        catch(Exception ex)
        {
        }
		return null;
	}

	/**
	 * Capture the WebView and email
	 */
	public void captureAsEmail()
	{
		captureAsEmail("", "", "");
	}
	
	/**
	 * Capture the WebView and email
	 * 
	 * @param	to		Email recipient
	 * @param	subject	Email subject
	 * @param	body	Email body
	 */
	public void captureAsEmail(String to, String subject, String body)
	{
		File file = captureAsFile();
		if (file != null)
		{
			try
			{
				Intent intent = new Intent(Intent.ACTION_SEND);
				intent.setType("plain/text");
				if (!to.equals(""))
				{
					intent.putExtra(Intent.EXTRA_EMAIL, to);
				}
				if (!subject.equals(""))
				{
					intent.putExtra(Intent.EXTRA_SUBJECT, subject);
				}
				if (!body.equals(""))
				{
					intent.putExtra(Intent.EXTRA_TEXT, body);
				}
				intent.putExtra(Intent.EXTRA_STREAM, Uri.fromFile(file));
				this.sigi.executeIntent(this, Intent.createChooser(intent, "Send your email with:"), WhoopingkofExtension.SEND_EMAIL);
			}
			catch (Exception ex)
			{
			}
		}
	}
	
	/**
	 * Handle application pause
	 */
	public void onPause() {
		if (isActiveGps)
		{
			stopLocationUpdates();
		}
	}
	
	/**
	 * Handle application resume
	 */
	public void onResume() {
		if (isActiveGps)
		{
			startLocationUpdates();	
		}
	}

	/**
	 * Intent complete callback
	 * 
	 * @param requestCode	Intent request code
	 * @param data			Intent instance
	 */
	@Override
	public void intentComplete(int requestCode, Intent intent)
	{
		if (requestCode == SELECT_PICTURE)
		{
			Uri uri = intent.getData();
			String path = this.sigi.getPath(uri);
			this.executeJS(this.generateDispatch("selectPicture", path));
		}
	}
	
	// --------------------------------------------------
	// Private Methods
	// --------------------------------------------------

	/**
	 * Generate location JSON data
	 * 
	 * @return	String containing JSON representation
	 */
	private String generateLocationData(Location location)
	{
		try
		{
			if (location != null)
			{
				return "{ \"lat\": \"" + String.valueOf(location.getLatitude()) + "\", \"long\": \"" + String.valueOf(location.getLongitude()) + "\" }";
			}
		}
		catch (Exception ex)
		{
		}
		return "";
	}
	
	private String generateDispatch(String event, String data, boolean isJSON)
	{
		return "window.$w.dispatch('" + event + "', '" + data + "', " + (isJSON ? "true" : "false") + ");";
	}

	private String generateDispatch(String event, String data)
	{
		return generateDispatch(event, data, false);
	}
	
	private String generateDispatch(String event)
	{
		return "window.$w.dispatch('" + event + "');";
	}
	
	/**
	 * Start location updates
	 */
	private void startLocationUpdates()
	{
		Log.d("WhoopingkofExtension", "startLocationUpdates");
		locationManager.requestLocationUpdates(LOCATION_PROVIDER, LOCATION_INTERVAL, LOCATION_MIN_DISTANCE, this);			
	}
	
	/**
	 * Stop location updates
	 */
	private void stopLocationUpdates()
	{
		Log.d("WhoopingkofExtension", "stopLocationUpdates");
		locationManager.removeUpdates(this);
	}

	/**
	 * Capture the WebView as a PNG
	 * 
	 * @return	PNG as byte array
	 */
	private byte[] captureScreen()
	{
		// Compress as PNG and return as byte array
		ByteArrayOutputStream buffer = new ByteArrayOutputStream();
		try
		{
			// Capture the screen
			Picture picture = this.webView.capturePicture();
			Bitmap bitmap = Bitmap.createBitmap(picture.getWidth(), picture.getHeight(), Bitmap.Config.ARGB_8888);
			Canvas canvas = new Canvas(bitmap);
			picture.draw(canvas);
			bitmap.compress(Bitmap.CompressFormat.PNG, 100, buffer);
		}
		catch (Exception ex)
		{
			
		}
		return buffer.toByteArray();
	}
	
	// --------------------------------------------------
	// IHardwareDelegate Implementation
	// --------------------------------------------------

	/**
	 * Delegation method called when menu button is pressed (during onPrepareOptionsMenu)
	 * 
	 * @return	True if native menu should be displayed, false if not
	 */
	public boolean willShowMenu()
	{
		if (isCapturingMenu)
		{
			executeJS(generateDispatch("menu"));
//			executeJS("window.$w.dispatch('menu');");
			return false;
		}
		return true;
	}
	
	// --------------------------------------------------
	// LocationListener Implementation
	// --------------------------------------------------

	public void onLocationChanged(Location location)
	{
		Log.d("WhoopingkofExtension", "onLocationChanged: Latitude: " + String.valueOf(location.getLatitude()) + ", Longitude: " + String.valueOf(location.getLongitude()));
		currentLocation = location;
		executeJS(generateDispatch("gps", generateLocationData(currentLocation), true));
//		this.executeJS("window.$w.dispatch('gps', '" + generateLocationData(currentLocation) + "', true);");
	}
	
	public void onProviderDisabled(String provider) {
		Log.d("WhoopingkofExtension", "onProviderDisabled: " + provider);
	}

	public void onProviderEnabled(String provider) {
		Log.d("WhoopingkofExtension", "onProviderEnabled: " + provider);
	}

	public void onStatusChanged(String provider, int status, Bundle extras) {
		Log.d("WhoopingkofExtension", "onStatusChanged: " + provider);
		if (status == LocationProvider.AVAILABLE)
		{
			Log.d("WhoopingkofExtension", "Available - enable button: " + extras.getInt("satellites"));
		}
		else
		{
			Log.d("WhoopingkofExtension", "Unavailable - disable button: " + extras.getInt("satellites"));
		}
	}
	
}
