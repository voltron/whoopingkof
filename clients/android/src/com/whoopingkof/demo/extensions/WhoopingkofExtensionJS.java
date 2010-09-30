package com.whoopingkof.demo.extensions;

import java.io.File;

public interface WhoopingkofExtensionJS {

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
	 * Calculate the distance between two points
	 * 
	 * @param startLatitude		Starting latitude 
	 * @param startLongitude	Starting longitude
	 * @param endLatitude		Ending latitude
	 * @param endLongitude		Ending longitude
	 * @return	Distance in meters
	 */
	public double distanceBetween(String startLatitude, String startLongitude, String endLatitude, String endLongitude);
	
	/**
	 * Select a picture from the gallery
	 */
	public void selectPicture();
	
	/**
	 * Capture the WebView as a data URI
	 * 
	 * @return	Base64 encoded PNG
	 */
	public String captureAsDataURI();
	
	/**
	 * Capture the WebView and save PNG as a file
	 * 
	 * @param	filename	Filename of PNG to save
	 * @return	File instance of saved file
	 */
	public File captureAsFile(String filename);
	
	/**
	 * Capture the WebView and email
	 * 
	 * @param	to		Email recipient
	 * @param	subject	Email subject
	 * @param	body	Email body
	 */
	public void captureAsEmail(String to, String subject, String body);
	
}
