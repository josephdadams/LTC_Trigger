'use strict';
const path = require('path');
const {app, BrowserWindow, Menu, ipcMain, nativeImage, dialog} = require('electron');
/// const {autoUpdater} = require('electron-updater');
const {is} = require('electron-util');
const unhandled = require('electron-unhandled');
const debug = require('electron-debug');
const contextMenu = require('electron-context-menu');
const config = require('./config.js');
const menu = require('./menu.js');

const udp = require('dgram');
const { triggerAsyncId } = require('async_hooks');
var socket = null;

const axios = require('axios');

unhandled();
//debug();
contextMenu();

// Note: Must match `build.appId` in package.json
app.setAppUserModelId('com.josephadams.LTC_Trigger');

// Uncomment this before publishing your first version.
// It's commented out as it throws an error if there are no published versions.
// if (!is.development) {
// 	const FOUR_HOURS = 1000 * 60 * 60 * 4;
// 	setInterval(() => {
// 		autoUpdater.checkForUpdates();
// 	}, FOUR_HOURS);
//
// 	autoUpdater.checkForUpdates();
// }

// Prevent window from being garbage collected
let mainWindow;

const createMainWindow = async () => {
	const win = new BrowserWindow({
		title: app.name,
		show: false,
		width: 650,
		height: 500,
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
			enableRemoteModule: true
		}
	});

	win.on('ready-to-show', () => {
		win.show();
	});

	win.on('closed', () => {
		// Dereference the window
		// For multiple windows store them in an array
		mainWindow = undefined;
	});

	await win.loadFile(path.join(__dirname, 'index.html'));

	return win;
};

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
	app.quit();
}

app.on('second-instance', () => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}

		mainWindow.show();
	}
});

app.on('window-all-closed', () => {
	if (!is.macos) {
		app.quit();
	}
});

app.on('activate', async () => {
	if (!mainWindow) {
		mainWindow = await createMainWindow();
	}
});

//IPCs
ipcMain.on('udp_port_change', function (event) {
	startListening();
});

//Functions
function startListening() {
	try {
		//try to close the socket if it's open
		if (socket !== null) {
			socket.close();
			socket = null;
		}
	}
	catch(error) {
		//unable to close socket for some reason
	}

	let port = config.get('udpPort');

	try {
		//try to open the socket
		socket = udp.createSocket('udp4');
		socket.on('error', function(error) {
			console.log('Error: ' + error);
			socket.close();
		});
		
		socket.on('message', function(msg, info) {
			//console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
	
			checkTriggers(msg.toString());
		});
		
		socket.on('listening', function() {
			let address = socket.address();
	
			console.log('Socket listening at: ' + address.address + ':' + address.port);
		});
		
		socket.on('close', function() {
			console.log('Socket is closed!');
		});
		
		socket.bind(port);
	}
	catch (error) {
		//unable to open the socket for some reason
	}	
}

function checkTriggers(message) {
	//loop through all triggers and see if there is a match

	let triggers = config.get('triggers');

	if (message.indexOf('(') == 0) { //this is a message from LTC Reader
		try {
			let timecode = message.substring(2, 13);

			if (mainWindow) {
				mainWindow.webContents.send('timecode', timecode);
			}
		
			for (let i = 0; i < triggers.length; i++) {
				if  (triggers[i].timecode == timecode) {
					runAction(triggers[i]);
				}
			}
		}
		catch(error) {
			//unable to parse timecode, most likely
			let message = 'Unable to parse timecode.';
			if (mainWindow) {
				mainWindow.webContents.send('timecode', message);
			}
		}
	}
	else {
		let message = 'Unable to parse timecode. Is another program using this UDP Port?';
		if (mainWindow) {
			mainWindow.webContents.send('timecode', message);
		}
	}
}

function runAction(triggerObj) {
	//runs the action if there was a match

	//only URL is implemented currently, but this methodology supports other actions in the future
	if (triggerObj.url) {
		runUrl(triggerObj);
		if (mainWindow) {
			mainWindow.webContents.send('last_action', triggerObj);
		}
	}
}

function runUrl(triggerObj) {
	try {
		//perform the URL request
		let options = {
			method: triggerObj.method ? triggerObj.method : 'GET',
			url: triggerObj.url
		};

		//use POST with data if present
		if (triggerObj.method && triggerObj.method == 'POST') {
			options.method = 'POST';
			if (triggerObj.data) {
				options.data = triggerObj.data;
			}
		}

		axios(options)
		.then(function (response) {
			console.log('URL triggered.');
		})
		.catch(function (error) {
			console.log('Unable to run trigger.', error.errno);
		});
	}
	catch(error) {
		//some error sending the URL request
	}	
}

(async () => {
	await app.whenReady();
	Menu.setApplicationMenu(menu);
	mainWindow = await createMainWindow();

	startListening();
})();