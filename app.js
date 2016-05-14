/* jslint node: true */
'use strict';

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var fs = require('fs');
var request = require('request');

var gosu = require('gosugamers-api');

var app = express();
var http = require('http').Server(app);
var port = process.env.PORT || 7845;

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.set("jsonp callback", true);


app.get('/get/games/:type/:status', function (req, res) {
	var type = req.params.type;
	var status = req.params.status;
	
	console.log('Got request for ' + status + ' ' + type + ' games!');
	
	gosu.fetchMatchUrls(type, null, function (error, URLs) {
		gosu.parseMatches(URLs, function (error, data) {
			var matches = data;
			var liveMatches = [];
			var completeMatches = [];
			var upcomingMatches = [];
			
			for (var i = 0; i < matches.length; i++) {
				var match = matches[i];
				
				if (match.status == 'Complete') {
					completeMatches.push(match);
				} else if (match.status == 'Live') {
					liveMatches.push(match);
				} else if (match.status == 'Upcoming') {
					upcomingMatches.push(match);
				}
			}
			
			var sendMatches;
			if (status == 'live') {
				sendMatches = liveMatches;
			} else if (status == 'complete') {
				sendMatches = completeMatches;
			} else if (status == 'upcoming') {
				sendMatches = upcomingMatches;
			}
			
			console.log('Sending ' + sendMatches.length + ' ' + status + ' ' + type + ' matches back.');
			res.jsonp(JSON.stringify(sendMatches));
		});
	});
});


app.get('/get/greeting', function (req, res) {
	var response = {greeting: 'Hej!'};
	res.jsonp(JSON.stringify(response));
});


function getDetails(URL, callback) {
	
}

var server = http.listen(port, function () {
    console.log('Listening on port %d', server.address().port);
});