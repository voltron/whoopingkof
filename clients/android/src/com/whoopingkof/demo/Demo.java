package com.whoopingkof.demo;

import android.content.Context;
import android.os.Bundle;
import android.os.PowerManager;

import com.sigi.Sigi;
import com.whoopingkof.demo.extensions.WhoopingkofExtension;
import com.whoopingkof.web.WebSocketExtension;

public class Demo extends Sigi {

	// --------------------------------------------------
	// Private Fields
	// --------------------------------------------------

	/**
	 * Power manager wake lock
	 */
	protected PowerManager.WakeLock wakeLock = null;
	
	// --------------------------------------------------
	// Overridden Methods
	// --------------------------------------------------

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		// Add the WebView extensions
		this.addExtension(new WebSocketExtension());
		this.addExtension(new WhoopingkofExtension());
		
		// Set and load the root
		this.loadRoot("html/index.html");
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onPause() {
		releaseWakeLock();
		super.onPause();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onResume() {
		acquireWakeLock();
		super.onResume();
	}
	
	// --------------------------------------------------
	// Private Methods
	// --------------------------------------------------
	
	/**
	 * Acquire a wake lock
	 */
	protected void acquireWakeLock()
	{
		try
		{
			if (wakeLock == null)
			{
				PowerManager powerManager = (PowerManager)getSystemService(Context.POWER_SERVICE);
				wakeLock = powerManager.newWakeLock(PowerManager.SCREEN_BRIGHT_WAKE_LOCK, "Sigi");
			}
			wakeLock.acquire();
		}
		catch (Exception ex)
		{
		}
	}
	
	/**
	 * Release the wake lock
	 */
	protected void releaseWakeLock()
	{
		try
		{
			if (wakeLock != null)
			{
				wakeLock.release();
			}
		}
		catch (Exception ex)
		{
		}
	}	
}
