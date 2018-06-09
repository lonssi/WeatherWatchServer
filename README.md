
## WeatherWatchServer

### What is WeatherWatchServer?

WeatherWatchServer is an ExpressJS web server that fetches weather forecast data from the Open Data API by the Finnish Meteorological Institute (https://en.ilmatieteenlaitos.fi/open-data).

WeatherWatchServer is used by WeatherWatch (https://github.com/lonssi/WeatherWatch), a web application that displays weather forecast information in an analog clock face format.

### Requirements

The following are required to run the project:

- `docker`
- `docker-compose`

### Getting started

In order to access the Open Data API an API-key is needed.
An API-key can be obtained by registering to the Open Data service.
After you have obtained your API-key, create a file `config.js` to the `app/` directory with the following contents:

```

export const Configuration = {
    apikey: "INSERT-YOUR-API-KEY-HERE",
};

```

To start the server run the `run.sh` script. The server is then served on the port `8888`.

### License

This project is distributed under the [MIT License](http://opensource.org/licenses/MIT).