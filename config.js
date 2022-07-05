'use strict';
const Store = require('electron-store');

module.exports = new Store({
	defaults: {
		udpPort: 53001,
		triggers: [
			{ 
				timecode: '00:00:00:00', 
				url: 'http://127.0.0.1:44188/api/cue/cueid',
				method: 'POST'
			}
		]
	}
});