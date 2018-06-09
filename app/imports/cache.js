import { Helpers } from './helpers.js';
import _ from 'lodash';


/**
 * Stores queried weather information to a cache
 * Weather data older than an hour will not be returned
 */
class WeatherCache {

	constructor() {
		this.weatherCache = {};
		this.nameCache = {};
		this.weatherCacheMaxSize = 500;
		this.nameCacheMaxSize = 5000;
		this.distanceThreshold = 2.5;
	}

	/**
	 * Add weather data to cache with the location name as key
	 * Also add the location name to name cache with the user inputted name as key
	 * @param {Object} weatherData - weather data object
	 * @param {String} locationUser - user inputted location name
	 */
	add(weatherData, locationUser) {

		const trueName = weatherData.location.toUpperCase();
		this.weatherCache[trueName] = weatherData;

		if (locationUser && _.isString(locationUser)) {
			locationUser = locationUser.toUpperCase();
			this.nameCache[locationUser] = { "name": trueName, "time": new Date() };

			// Delete oldest element if cache max size has been exceeded
			if (Object.keys(this.nameCache).length > this.nameCacheMaxSize) {
				removeOldest(this.nameCache);
			}
		}

		// Delete oldest element if cache max size has been exceeded
		if (Object.keys(this.weatherCache).length > this.weatherCacheMaxSize) {
			removeOldest(this.weatherCache);
		}
	}

	_findByName(locationUser, date) {

		locationUser = locationUser.toUpperCase();
		var location = locationUser;

		// First try to find a matching true name from name cache
		const trueNameObject = this.nameCache[locationUser];
		if (trueNameObject) {
			location = trueNameObject.name;
		}

		const weatherData = this.weatherCache[location];
		if (weatherData) {
			if (Helpers.dataIsOutdated(weatherData, true)) {
				delete this.weatherCache[location];
			} else {
				return weatherData;
			}
		}

		return null;
	}

	_findByPosition(locationUser, date) {

		for (const key in this.weatherCache) {

			const weatherData = this.weatherCache[key];

			if (Helpers.dataIsOutdated(weatherData, true)) {
				delete this.weatherCache[key];
				continue;
			}

			const position = weatherData.position;
			const distance = Helpers.getLatLonDistance(locationUser, position);
			if (distance <= this.distanceThreshold) {
				return weatherData;
			}
		}
		return null;
	}

	/**
	 * Get weather data from the cache
	 * @param  {String or Object} locationUser - user inputted location
	 * @param  {Date} date - current time
	 * @return {Object} - weather data object
	 */
	get(locationUser, date) {
		if (_.isString(locationUser)) {
			return this._findByName(locationUser, date);
		} else {
			return this._findByPosition(locationUser, date);
		}
	}

	/**
	 * Remove the oldest element from a cache
	 * @param  {Object} cache - weather data cache or location name cache
	 */
	removeOldest(cache) {
		var keyOldest = Object.keys(cache)[0];
		var dateOldest = cache[keyOldest].time;
		for (const key in cache) {
			const date = cache[key].time
			if (date < dateOldest) {
				keyOldest = key;
				dateOldest = date;
			}
		}
		delete cache[keyOldest];
	}
}

export const weatherCache = new WeatherCache();
