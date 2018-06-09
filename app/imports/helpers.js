import { Constants } from './constants.js';
import _ from 'lodash';


let getClosestStartingHourDate = function(date) {
	return date.getTime() - date.getMinutes() * Constants.minuteEpochs -
		date.getSeconds() * Constants.secondEpochs - date.getMilliseconds();
};

let deg2rad = function(deg) {
	return deg * (Math.PI/180);
};

export const Helpers = {

	/**
	 * Constructs a request URL from user location
	 * @param	{String or Object} location - user location
	 * @param	{Date} date - request time instance
	 * @param	{String} apikey - Weather service API key
	 * @return {String} - request URL
	 */
	getAPIRequestURL: (location, date, apikey) => {

		const startDate = new Date(getClosestStartingHourDate(date));
		const startDateStr = startDate.toISOString();

		const host = 'https://data.fmi.fi/fmi-apikey/';
		const request = "fmi::forecast::hirlam::surface::point::multipointcoverage";

		let url = host + apikey + "/wfs" + "?request=getFeature" +
			"&storedquery_id=" + request + "&starttime=" + startDateStr;

		if (_.isString(location)) {
			url += "&place=" + encodeURIComponent(location);
		} else if (_.isObject(location)) {
			url += "&latlon=" + location.latitude + "," + location.longitude;
		}

		return url;
	},

	/**
	 * Check for errors in the XML content
	 * If a match is found, a correspoding error message is returned
	 * @param	{Object} content - XML string
	 * @return {String}
	 */
	checkForErrors: (content) => {
		if (content.match("getaddrinfo")) {
			return "Could not connect to server";
		} else if (content.match("No data available for") ||
			content.match("No locations found")) {
			return "Weather data unavailable for location";
		} else if (content.match("invalid byte sequence")) {
			return "Encoding error";
		} else {
			return null;
		}
	},

	dataIsOutdated: (data) => {
		const diff = new Date() - data.time;
		return diff >= Constants.hourEpochs;
	},

	parseLocation: (location) => {

		const error = new Error("Invalid input parameters");

		const tokens = location.split(",");
		const n = tokens.length;

		if (n === 1) {
			return location;
		} else if (n === 2) {
			const longitude = tokens[0];
			const latitude = tokens[1];
			if (isNaN(latitude) || isNaN(longitude)) {
				throw error;
			}
			return {
				latitude: parseFloat(latitude),
				longitude: parseFloat(longitude)
			}
		} else {
			throw error;
		}
	},

	/**
	 * Returns the minimum distance between two longitude-latitude coordinate pairs in kms
	 * @param  {Object} loc1 - first location
	 * @param  {Object} loc2 - second location
	 * @return {Number}      - distance in kilometers
	 */
	getLatLonDistance: (loc1, loc2) => {

		const lat1 = loc1.latitude;
		const lon1 = loc1.longitude;

		const lat2 = loc2.latitude;
		const lon2 = loc2.longitude;

		let R = 6371;  // Radius of the earth in km
		let dLat = deg2rad(lat2 - lat1);  // deg2rad below
		let dLon = deg2rad(lon2 - lon1);
		let a =
			Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
			Math.sin(dLon/2) * Math.sin(dLon/2);
		let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		let d = R * c; // Distance in km
		return d;
	}
}
