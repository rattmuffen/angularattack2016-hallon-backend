/* jslint node: true */
'use strict';

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var fs = require('fs');
var request = require('request');
var https = require('https');

var gosu = require('gosugamers-api');
var twitchStream = require('twitch-get-stream');

var app = express();
var http = require('http').Server(app);
var port = process.env.PORT || 7845;

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.set("jsonp callback", true);


app.get('/get/stream/:channel', function (req, res) {
	var channel = req.params.channel;
	console.log('Get streams for ' + channel);
	
	twitchStream.get(channel).then(function (streams) {
		res.jsonp(JSON.stringify(streams));
	});
});

app.get('/get/channel/:url', function (req, res) {
	var gosuUrl = req.params.url;
	
	var tournamentString = gosuUrl.split('/')[5];
	var tournament = tournamentString.substr(tournamentString.indexOf('-') + 1, tournamentString.length);
	tournament = tournament.replace(new RegExp('-', 'g'), ' ');
	console.log('Search for tournament: ' + tournament);
		
	callTwitchAPI('search/channels?q=' + encodeURIComponent(tournament), function (results) {
		res.send(JSON.stringify(results));
	});
});


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
			} else if (status == 'all') {
				sendMatches = matches;
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



function callTwitchAPI(url, callback) {
	var options = {
		host: 'api.twitch.tv',
		port: 443,
		path: '/kraken/' + url,
		method: 'GET'
	};
	
	var request = https.request(options, function (resp) {
		var responseBody = ''
		resp.setEncoding('utf8');

		resp.on('data', function (chunk) {
			responseBody += chunk;
		});

		resp.on('end', function () {
			request.end();
			callback(responseBody);
		});

		resp.on('close', function () {
			request.end();
		});

		resp.on('error', function () {
			request.end();
		});
	});
	request.end();
}


var server = http.listen(port, function () {
    console.log('Listening on port %d', server.address().port);
});