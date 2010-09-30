#include <Wire.h>
#include <Ethernet.h>
#include <WString.h>
#include <aJSON.h>
#include <BlinkM_funcs.h>

#define DEBUG

#ifdef DEBUG
#define DEBUG_PRINTLN(x) Serial.println(x)
#define DEBUG_PRINT(x) Serial.print(x)
#else
#define DEBUG_PRINTLN(x)
#define DEBUG_PRINT(x)
#endif

// Initialize the local variables
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
byte ip[] = { 192, 168, 2, 100 };
byte server[] = { 205, 186, 154, 96 }; // WebSocket service IP
int port = 8080; // WebSocket port

// Start and end frame bytes
byte START_TEXT_FRAME = 0x00;
byte END_FRAME = 0xFF;

// String buffer and reading flag
String host = String();
String readBuffer = String();
boolean is_reading = false;
boolean is_connected = false;
int id = 0;

// Create the client
Client client(server, port);

void setup()
{
#ifdef DEBUG
  // Open the serial port
  Serial.begin(9600);
#endif
  // Pause 1 second
  delay(2000);

  // Initilalize
  initialize();
  
  // Create the host string
  int length = sizeof(server);
  for (int i = 0; i < length; i++)
  {
    if (i > 0)
    {
      host += ".";
    }
    host += server[i];
  } 

  // Initialize ethernet
  Ethernet.begin(mac, ip);
}

void loop()
{
  if (client.available()) {
    byte buffer = client.read();
    if (buffer == START_TEXT_FRAME && !is_reading)
    {
      is_reading = true;
      if (readBuffer.length() > 0)
      {
        readBuffer = String();
      }
    }
    else if (buffer == END_FRAME && is_reading)
    {
      is_reading = false;
      
      DEBUG_PRINT("Buffer: ");
      DEBUG_PRINTLN(readBuffer);
      aJsonObject* json = aJson.parse(readBuffer);
      readBuffer = String();
      if (json == NULL)
      {
        DEBUG_PRINTLN("Invalid JSON");
      }
      else
      {
        String type = aJson.getObjectItem(json, "type")->value.valuestring;
        aJsonObject* to = aJson.getObjectItem(json, "to");
        boolean is_to = to != NULL && to->type == aJson_Number && to->value.number.valueint == id;
        if (!is_to && to->type == aJson_String)
        {
          String to_value = to->value.valuestring;
          if (to_value.equals(""))
          {
            is_to = true;
          }
        }
        if (type.equals("identity"))
        {
          id = to->value.number.valueint;
          DEBUG_PRINT("Identity: ");
          DEBUG_PRINTLN(id);
        }
        else if (is_to && !type.equals("connected") && !type.equals("disconnected"))
        {
          aJsonObject* data = aJson.getObjectItem(json, "data");
          if (data != NULL)
          {
            processMessage(type, data);
          }
          else
          {
            DEBUG_PRINT("Missing data: ");
            DEBUG_PRINTLN(type);
          }
        }  
        else
        {
          DEBUG_PRINT("Skipped message: ");
          DEBUG_PRINTLN(type);
        }
        aJson.deleteItem(json);
      }
    }
    else if (is_reading)
    {
      readBuffer += char(buffer);
    }
  }
  // Check if disconnected
  if (!client.connected()) 
  {
    id = 0;
    if (is_connected)
    {
      is_connected = false;
      // onDisconnected callback
      onDisconnected();
      // Close the client
      DEBUG_PRINTLN("WebSocket disconnected");
      client.stop();
    }
    // Connect the WebSocket
    connect();
  }
}

// Connect the WebSocket
void connect()
{
  DEBUG_PRINT("Opening WebSocket to ");
  DEBUG_PRINT(host);
  DEBUG_PRINT(":");
  DEBUG_PRINT(port);
  DEBUG_PRINT("...");
  
  // Connect the socket server
  if (client.connect()) {
    DEBUG_PRINTLN("connected");
    is_connected = true;
    // Call the onConnected method
    onConnected();
    // Send the handshake
    client.println("GET / HTTP/1.1");
    String header = String("Host: ");
    header += host;
    client.println(header);
    client.println("Connection: Upgrade");
    client.println("Upgrade: WebSocket");
    header = String("Origin: http://");
    header += host;
    if (port != 80)
    {
      header += ":" + port;
    }
    client.println(header);
    client.println();
  } 
  else 
  {
    DEBUG_PRINTLN("connection failed");
    delay(1000);
  }
}  

/**
 * PAINT IMPLEMENTATION
 */

// Maximum color value
int MAX = 255; 

// Current color
int color[] = {128, 255, 255}; // Cyan (middle hue)
float ratio_h = (float)255 / (float) 360;
float ratio_sb = (float)255 / (float)100;
boolean is_on = false;
int blinkm_addr = 0x00; // BlinkM MaxM address

void initialize()
{
  DEBUG_PRINTLN("Initialize");

  // Power the BlinkM MaxM
  BlinkM_beginWithPower();
  delay(500); // Let the power stabilize
  // Stop the script
  BlinkM_stopScript(blinkm_addr);
  // Initialize the lamp
  updateLamp(false);
  setFade(true);
  // Test cycle of red, green and blue
  BlinkM_fadeToHSB(blinkm_addr, convertH(0), 255, 255);
  delay(600);
  BlinkM_fadeToHSB(blinkm_addr,  convertH(120), 255, 255);
  delay(600);
  BlinkM_fadeToHSB(blinkm_addr,  convertH(240), 255, 255);
  delay(600);
  updateLamp(false);
}  

// onConnected callback
void onConnected()
{
  DEBUG_PRINTLN("onConnected");
  updateLamp(is_on);
}

// onDisconnected callback
void onDisconnected()
{
  DEBUG_PRINTLN("onDisconnected");
  updateLamp(false);
}

// Process JSON messages 
void processMessage(String type, aJsonObject* data)
{
  DEBUG_PRINT("processMessage: ");
  DEBUG_PRINTLN(type);
  boolean has_update = false;
  if (type.equals("lampon") && !is_on)
  {
    is_on = true;
    has_update = true;
  }
  else if (type.equals("lampoff") && is_on)
  {
    is_on = false;
    has_update = true;
  }
  else if (type.equals("lampfade"))
  {
    setFade(true);
  }
  else if (type.equals("lampnofade"))
  {
    setFade(false);
  }
  else if (type.equals("lampcolor"))
  {
    color[0] = convertH(aJson.getObjectItem(data, "h")->value.number.valueint);
    color[1] = convertSB(aJson.getObjectItem(data, "s")->value.number.valueint);
    color[2] = convertSB(aJson.getObjectItem(data, "b")->value.number.valueint);
    has_update = true;
  }
  if (has_update)
  {
    updateLamp(is_on);
  }
}

void updateLamp(boolean on)
{
  if (on)
  {
    // Show stored color
    BlinkM_fadeToHSB(blinkm_addr, color[0], color[1], color[2]);
  }
  else
  {
    // Turn off lamp
    BlinkM_fadeToHSB(blinkm_addr, color[1], color[2], 0);
  }
}

void setFade(boolean fade)
{
  if (fade)
  {
    BlinkM_setFadeSpeed(blinkm_addr, 20);
  }
  else
  {
    BlinkM_setFadeSpeed(blinkm_addr, 255);
  }
}

// Convert hue from scale of 0-360 to scale of 0-255
int convertH(int value)
{
  return normalizeValue(round(value * ratio_h));
}

// Convert saturation/brightness from scale of 0-100 to scale of 0-255
int convertSB(int value)
{
  return normalizeValue(round(value * ratio_sb));
}

// Normalize a value on a scale of 0-255
int normalizeValue(int value)
{
  return max(min(value, MAX), 0);
}


