/* jslint node: true */
'use strict';

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var fs = require('fs');
var request = require('request');

var app = express();
var http = require('http').Server(app);
var port = process.env.PORT || 7845;

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));


app.get('/get/greeting', function (req, res) {
	res.send('Hello Frontend!<br>Regards, Backend.');
});

var server = http.listen(port, function () {
    console.log('Listening on port %d', server.address().port);
});