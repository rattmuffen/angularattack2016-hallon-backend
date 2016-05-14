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


app.get('/get/games/:query', function (req, res) {
	var type = req.params.query;
	console.log('Got request for ' + type + ' games!');
	
	gosu.fetchMatchUrls(type, null, function (error, URLs) {
		gosu.parseMatches(URLs, function (error, data) {
			var matches = data;
			var nonCompletedMatches = [];
			
			for (var i = 0; i < matches.length; i++) {
				var match = matches[i];
				if (match.status != 'Complete') {
					nonCompletedMatches.push(match);
				}
			}
			
			console.log('Sending ' + nonCompletedMatches.length + ' ' + type + ' matches back.');
			res.jsonp(nonCompletedMatches);
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