// utils/weatherUtils.ts

export interface WeatherInfo {
    icon: string;
    temp: number;
}

/**
 * Maps WMO Weather Interpretation Codes to Google Material Symbols icons.
 * @param code The WMO weather code from the Open-Meteo API.
 * @returns The corresponding Material Symbol icon name as a string.
 */
export const getWeatherIconFromWmoCode = (code: number): string => {
    switch (code) {
        case 0:
            return 'sunny'; // Clear sky
        case 1:
        case 2:
        case 3:
            return 'partly_cloudy_day'; // Mainly clear, partly cloudy, and overcast
        case 45:
        case 48:
            return 'foggy'; // Fog and depositing rime fog
        case 51:
        case 53:
        case 55:
            return 'rainy_light'; // Drizzle: Light, moderate, and dense intensity
        case 56:
        case 57:
            return 'rainy_snow'; // Freezing Drizzle: Light and dense intensity
        case 61:
        case 63:
        case 65:
            return 'rainy'; // Rain: Slight, moderate and heavy intensity
        case 66:
        case 67:
            return 'rainy_snow'; // Freezing Rain: Light and heavy intensity
        case 71:
        case 73:
        case 75:
            return 'weather_snowy'; // Snow fall: Slight, moderate, and heavy intensity
        case 77:
            return 'grain'; // Snow grains
        case 80:
        case 81:
        case 82:
            return 'rainy'; // Rain showers: Slight, moderate, and violent
        case 85:
        case 86:
            return 'weather_snowy'; // Snow showers slight and heavy
        case 95:
            return 'thunderstorm'; // Thunderstorm: Slight or moderate
        case 96:
        case 99:
            return 'thunderstorm'; // Thunderstorm with slight and heavy hail
        default:
            return 'thermostat'; // Default icon
    }
};

/**
 * Maps Bright Sky weather condition strings to Google Material Symbols icons.
 * @param condition The weather condition string from the Bright Sky API.
 * @returns The corresponding Material Symbol icon name as a string.
 */
export const getWeatherIconFromBrightSky = (condition: string): string => {
    switch (condition) {
        case 'clear-day':
            return 'sunny';
        case 'clear-night':
            return 'dark_mode';
        case 'partly-cloudy-day':
            return 'partly_cloudy_day';
        case 'partly-cloudy-night':
            return 'partly_cloudy_night';
        case 'cloudy':
            return 'cloudy';
        case 'fog':
            return 'foggy';
        case 'wind':
            return 'air';
        case 'rain':
            return 'rainy';
        case 'sleet':
            return 'rainy_snow';
        case 'snow':
            return 'weather_snowy';
        case 'hail':
            return 'grain';
        case 'thunderstorm':
            return 'thunderstorm';
        default:
            return 'thermostat'; // Default icon
    }
};
