import HTTPTransport, { HTTPError } from '../framework/HTTPTransport';

/** Open-Meteo: free forecast API, no key required. https://open-meteo.com/en/docs */
export const WEATHER_API_URL = 'https://api.open-meteo.com/v1';

export interface CurrentWeather {
  time: string;
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
}

export interface DailyForecast {
  date: string;
  min: number;
  max: number;
  weatherCode: number;
  description: string;
}

interface OpenMeteoResponse {
  current?: {
    time: string;
    temperature_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

/** Only the part of the HTTPTransport API the service needs, so tests can pass a stub. */
export type WeatherTransport = Pick<HTTPTransport, 'get'>;

const MAX_FORECAST_DAYS = 16;

/** WMO weather interpretation codes, grouped. */
export function describeWeatherCode(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'Rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'Snow';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

function assertCoordinates(latitude: number, longitude: number): void {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new RangeError(`Latitude must be between -90 and 90, got ${latitude}`);
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new RangeError(`Longitude must be between -180 and 180, got ${longitude}`);
  }
}

export default class WeatherService {
  private http: WeatherTransport;

  constructor(http: WeatherTransport = new HTTPTransport(WEATHER_API_URL)) {
    this.http = http;
  }

  async getCurrentWeather(latitude: number, longitude: number): Promise<CurrentWeather> {
    assertCoordinates(latitude, longitude);

    const data = await this.fetchForecast({
      latitude,
      longitude,
      current: 'temperature_2m,wind_speed_10m,weather_code',
      timezone: 'auto',
    });

    if (!data.current) {
      throw new Error('Malformed weather response: "current" is missing');
    }

    const { time, temperature_2m, wind_speed_10m, weather_code } = data.current;
    return {
      time,
      temperature: temperature_2m,
      windSpeed: wind_speed_10m,
      weatherCode: weather_code,
      description: describeWeatherCode(weather_code),
    };
  }

  async getDailyForecast(latitude: number, longitude: number, days = 3): Promise<DailyForecast[]> {
    assertCoordinates(latitude, longitude);
    if (!Number.isInteger(days) || days < 1 || days > MAX_FORECAST_DAYS) {
      throw new RangeError(`Days must be an integer between 1 and ${MAX_FORECAST_DAYS}, got ${days}`);
    }

    const data = await this.fetchForecast({
      latitude,
      longitude,
      daily: 'temperature_2m_max,temperature_2m_min,weather_code',
      forecast_days: days,
      timezone: 'auto',
    });

    if (!data.daily) {
      throw new Error('Malformed weather response: "daily" is missing');
    }

    const { time, temperature_2m_max, temperature_2m_min, weather_code } = data.daily;
    return time.map((date, i) => ({
      date,
      min: temperature_2m_min[i],
      max: temperature_2m_max[i],
      weatherCode: weather_code[i],
      description: describeWeatherCode(weather_code[i]),
    }));
  }

  private async fetchForecast(params: Record<string, string | number>): Promise<OpenMeteoResponse> {
    try {
      const { data } = await this.http.get<OpenMeteoResponse>('/forecast', { data: params });
      return data;
    } catch (error) {
      // Open-Meteo explains failures as { error: true, reason: "..." }.
      if (error instanceof HTTPError) {
        const reason = (error.data as { reason?: string } | null)?.reason;
        throw new Error(`Weather request failed (${error.status}): ${reason ?? error.message}`);
      }
      throw error;
    }
  }
}
