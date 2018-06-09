import moment from 'moment';
import 'moment-timezone';
import SunCalc from 'suncalc';
import _ from 'lodash';
import { Constants } from './constants.js';

let findCelestialEvents = function(timestamp, position, moon) {

	const now = timestamp.getTime();

	const rises = [];
	const sets = [];

	let timesFunction = (!moon) ? SunCalc.getTimes : SunCalc.getMoonTimes;

	const riseKey = (!moon) ? "sunrise" : "rise";
	const setKey = (!moon) ? "sunset" : "set";

	const maxIterations = 500;

	for (let i = 0; i < maxIterations; i++) {

		const date = new Date(now + i * 12 * Constants.hourEpochs);
		const times = timesFunction(date, position.latitude, position.longitude);
		const riseAttribute = times[riseKey];
		const setAttribute = times[setKey];

		if (riseAttribute) {
			const rise = riseAttribute.getTime();
			if (rise && rise !== 0 && !_.includes(rises, rise)) {
				rises.push(rise);
			}
		}

		if (setAttribute) {
			const set = setAttribute.getTime();
			if (set && set !== 0 && !_.includes(sets, set)) {
				sets.push(set);
			}
		}

		const nRises = rises.length;
		const nSets = sets.length;

		if (nRises > 1 && nSets > 1) {

			const enoughRiseSpan = rises[nRises - 1] - now >= Constants.dayEpochs;
			const enoughSetSpan = sets[nSets - 1] - now >= Constants.dayEpochs;

			if (enoughRiseSpan && enoughSetSpan) {
				break;
			}
		}
	}

	return { rises, sets };
};

let createWeatherObject = function(timestamp, startDate, location, country,
	latLonString, timeZoneString, headerArray, valueArray) {

	const weatherData = {};

	weatherData.version = Constants.version;
	weatherData.status = "success";

	weatherData.location = location;
	weatherData.country = country;
	weatherData.time = timestamp.getTime();
	weatherData.timeZone = timeZoneString;
	weatherData.timeZoneOffset = moment.tz(timeZoneString).utcOffset() / 60;
	weatherData.values = [];

	const positionTokens = latLonString.trim().split(' ');

	weatherData.position = {
		latitude: parseFloat(positionTokens[0]),
		longitude: parseFloat(positionTokens[1])
	};

	weatherData.sunEvents = findCelestialEvents(timestamp, weatherData.position, false);
	weatherData.moonEvents = findCelestialEvents(timestamp, weatherData.position, true);

	const nHeaders = headerArray.length;
	const nObjects = valueArray.length / nHeaders;

	for (let i = 0; i < nObjects; i++) {

		const weatherObject = {};

		weatherObject.time = startDate.getTime() + i * Constants.hourEpochs;

		let dateObject = new Date(weatherObject.time);

		weatherObject.sunPosition = SunCalc.getPosition(
			dateObject,
			weatherData.position.latitude,
			weatherData.position.longitude
		);

		weatherObject.moonPosition = SunCalc.getMoonPosition(
			dateObject,
			weatherData.position.latitude,
			weatherData.position.longitude
		);

		weatherObject.moonIllumination = SunCalc.getMoonIllumination(
			dateObject
		);

		for (let j = 0; j < nHeaders; j++) {
			const header = headerArray[j];
			const value = valueArray[i * nHeaders + j];
			weatherObject[header] = parseFloat(value);
		}

		weatherData.values.push(weatherObject);
	}

	return weatherData;
}

let parseXml = function(data) {

	let DOMParser = require('xmldom').DOMParser;
	let parser = new DOMParser();
	let xmlDoc = parser.parseFromString(data, "text/xml");

	const location = xmlDoc.getElementsByTagName("gml:name")[0].firstChild.data;
	const latLonString = xmlDoc.getElementsByTagName("gml:pos")[0].firstChild.data;
	const docAttributes = xmlDoc.getElementsByTagName("wfs:FeatureCollection")[0].attributes;
	const startDate = new Date(xmlDoc.getElementsByTagName("gml:beginPosition")[0].firstChild.data);
	const timeZoneString = xmlDoc.getElementsByTagName("target:timezone")[0].firstChild.data;
	const headerElements = xmlDoc.getElementsByTagName("swe:DataRecord")[0].childNodes;
	const rawValues = xmlDoc.getElementsByTagName("gml:doubleOrNilReasonTupleList")[0].firstChild.data;

	let country = null;
	try {
		country = xmlDoc.getElementsByTagName("target:country")[0].firstChild.data;
	} catch (e) {}

	let timestamp;
	for (let i = 0; i < docAttributes.length; i++) {
		if (docAttributes[i].name === "timeStamp") {
			timestamp = new Date(docAttributes[i].nodeValue);
		}
	}

	const valueArray = rawValues.replace(/[^\x20-\x7E]/gmi, "").split(' ').map(function(item) {
		return item ? item : null;
	}).filter(n => n);

	const headerArray = []
	for (let i = 0; i < headerElements.length; i++) {
		const headerElement = headerElements[i];
		if (headerElement.attributes) {
			const name = headerElement.attributes[0].nodeValue;
			headerArray.push(name);
		}
	}

	return createWeatherObject(
		timestamp, startDate, location, country, latLonString,
		timeZoneString, headerArray, valueArray
	);
};

export const Parsing = {
	parseXml
};
