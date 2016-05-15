/* jslint node: true */
'use strict';

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var fs = require('fs');
var request = require('request');
var https = require('https');
var async = require('async');

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
	try {
		var channel = req.params.channel;
		console.log('Get streams for ' + channel);

		twitchStream.get(channel).then(function (streams) {
			res.jsonp(JSON.stringify(streams));
		});
	} catch (error) {
		res.jsonp(JSON.stringify({'error': error}));
	}
});

app.get('/get/channel/:url', function (req, res) {
	try {
		var gosuUrl = req.params.url;
		
		var tournament = getTournament(gosuUrl);
		console.log('Search for tournament: ' + tournament);

		callTwitchAPI('search/channels?q=' + encodeURIComponent(tournament), function (data) {
			var channels = JSON.parse(data).channels;
			var streams = [];
			
			async.map(channels, function(item, callback) {
				var channel = item;
				
				callTwitchAPI('streams/' + channel.name, function (data) {
					var stream = JSON.parse(data);
					
					if (stream.stream) {
						console.log('Got stream for channel ' + channel.name + ': ' + stream);
						
						streams.push(stream.stream)
						callback();
					} else {
						callback();
					}
				});
			}, function (err, results) {
				if (err) {
					console.log(err);
					res.jsonp(JSON.stringify({'error': err}));
				}
				
				res.jsonp(JSON.stringify(streams));
			});
		
		});
	} catch (error) {
		res.jsonp(JSON.stringify({'error': error}));
	}
});


app.get('/get/gameinfo/:game', function (req, res) {
	try {
		var game = req.params.game;
		
		callTwitchAPI('search/games?q=' + encodeURIComponent(game) + '&type=suggest', function (data) {
			var games = JSON.parse(data).games;
			
			if (games && games.length >= 1) {
				res.jsonp(JSON.stringify(games[0]));
			} else {
				res.jsonp(JSON.stringify({}));
			}
		})
		
	} catch (error) {
		res.jsonp(JSON.stringify({'error': error}));
	}
})


app.get('/get/games/:type/:status', function (req, res) {
	try {
		var type = req.params.type;
		var status = req.params.status;

		console.log('Got request for ' + status + ' ' + type + ' games!');

		gosu.fetchMatchUrls(type == 'all' ? null : type, null, function (error, URLs) {
			if (error) {
				res.jsonp(JSON.stringify({'error': error}));
			} else {

				gosu.parseMatches(URLs, function (error, data) {
					if (error) {
						res.jsonp(JSON.stringify({'error': error}));
					} else {
						var matches = data;
						var liveMatches = [];
						var completeMatches = [];
						var upcomingMatches = [];

						for (var i = 0; i < matches.length; i++) {
							var match = matches[i];
							match.tournament = getTournament(match.url);

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
					}
				});
			}
		});
	} catch (error) {
		res.jsonp(JSON.stringify({'error': error}));
	}
});


app.get('/get/greeting', function (req, res) {
	var response = {greeting: 'Hej!'};
	res.jsonp(JSON.stringify(response));
});


function getTournament(gosuURL) {
	var tournamentString = gosuURL.split('/')[5];
	var tournament = tournamentString.substr(tournamentString.indexOf('-') + 1, tournamentString.length);
	tournament = tournament.replace(new RegExp('-', 'g'), ' ');
	
	return tournament;
}

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