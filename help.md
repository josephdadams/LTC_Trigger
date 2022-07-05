# LTC Trigger

This software is designed to work alongside LTC_Reader, a program that can parse timecode data from a variety of sources and then relay that timecode data via UDP to this program.

The Settings window is used to configure the software for the UDP listening port as well as create triggers to run actions when a matching timecode is received.

## Setting the UDP Listening Port

The default port is `53001`, which should also be the defaulat port in LTC_Reader. You may need to change this port for some reason, and you can do so by typing in the port value into the field and clicking 'Save'.

## Creating Triggers

Triggers contain a timecode value and a corresponding action. When the program receives that timecode value from LTC Reader, it will run that action.

All triggers are stored as JSON data, so the program can be easily extended and supports custom fields as necessary. This will make implementing future actions a lot simpler.

### Current Supported Actions

* Send HTTP GET

```javascript
{
	"timecode": "00:00:00:00",
	"url": "http://127.0.0.1",
	"method": "GET"
}
```

* Send HTTP Post

```javascript
{
	"timecode": "00:00:00:00",
	"url": "http://127.0.0.1",
	"method": "POST"
}
```

You can also include a `data` property and include any data you would like to send. By default, it will be sent as `application/json`.

### Using the "Insert Timecode" button

If you use  the "Insert Timecode" button, a trigger object will automatically be created and inserted for you. It uses HTTP POST by default.