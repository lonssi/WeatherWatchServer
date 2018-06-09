'use strict';

import express from 'express';
import bodyParser from 'body-parser';
import RateLimit from 'express-rate-limit';
import fetch from 'node-fetch';
import { Configuration } from './config.js';
import { Parsing } from './imports/parsing.js';
import { Helpers } from './imports/helpers.js';
import { weatherCache } from './imports/cache.js';
import _ from 'lodash';
import xss from 'xss';

const PORT = process.env.PORT;
const HOST = '0.0.0.0';

const app = express();

var limiter = new RateLimit({
	windowMs: 5000,
	max: 4,
	delayMs: 100
});

//	apply to all requests
app.use(limiter);

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/weather/:location', (req, res) => {

	let location;
	try {
		location = Helpers.parseLocation(xss((req.params.location)));
	} catch (error) {
		res.json({ status: "error", message: error.message });
		return;
	}

	const date = new Date();

	// Try to find cached weather data
	const cacheResult = weatherCache.get(location, date);
	if (cacheResult) {
		res.json(cacheResult);
		return;
	}

	const apikey = Configuration.apikey;
	const url = Helpers.getAPIRequestURL(location, date, apikey);
	const locationString = (_.isObject(location)) ? location.latitude + ", " + location.longitude : location;
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	console.log(date + ": " + ip + " requests weather data for location: " + locationString);

	fetch(url)
		.then(result => result.text())
		.then(content => {
			const errorMessage = Helpers.checkForErrors(content);
			if (errorMessage) {
				throw new Error(errorMessage);
			}
			return content;
		})
		.then(content => {
			// Remove instances of the apikey just in case
			return content.replace(new RegExp(apikey, 'gi'), '');
		})
		.then(content => {
			try {
				// Create weather data object of the raw XML data
				return Parsing.parseXml(content);
			} catch (error) {
				console.log(error.message);
				console.log(error.stack);
				throw new Error("Weather data parsing failed");
			}
		})
		.then(weatherData => {
			// Return data to client
			res.json(weatherData);
			return weatherData;
		})
		.then(weatherData => {
			// Cache weather data
			try {
				weatherCache.add(weatherData, location);
			} catch (error) {
				// If error occurs don't throw it,
				// because it is of no concern for the client at this point
				console.log(error.message);
				console.log(error.stack);
			}
		})
		.catch(error => {
			if (error.name === "Error") {
				// Errors related to pipeline
				res.json({ status: "error", message: error.message });
			} else {
				// Fetching or unknown errors
				console.log(error.message);
				console.log(error.stack);
				res.json({ status: "error", message: "Could not connect to server" });
			}
		});
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
