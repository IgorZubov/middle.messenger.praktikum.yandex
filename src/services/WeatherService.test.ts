import { beforeEach, describe, expect, it, vi } from 'vitest';
import WeatherService, { describeWeatherCode, WEATHER_API_URL } from './WeatherService';
import type { WeatherTransport } from './WeatherService';
import { HTTPError } from '../framework/HTTPTransport';
import FakeXHR from '../test-utils/FakeXHR';

const currentResponse = {
  current: { time: '2026-11-16T16:45', temperature_2m: 3.4, wind_speed_10m: 8.4, weather_code: 1 },
};

const dailyResponse = {
  daily: {
    time: ['2026-11-16', '2026-11-17'],
    temperature_2m_max: [4.6, 1.4],
    temperature_2m_min: [0.6, -0.1],
    weather_code: [3, 61],
  },
};

describe('describeWeatherCode', () => {
  it.each([
    [0, 'Clear sky'],
    [2, 'Partly cloudy'],
    [45, 'Fog'],
    [53, 'Drizzle'],
    [63, 'Rain'],
    [81, 'Rain'],
    [75, 'Snow'],
    [95, 'Thunderstorm'],
    [42, 'Unknown'],
  ])('maps WMO code %i to "%s"', (code, text) => {
    expect(describeWeatherCode(code)).toBe(text);
  });
});

describe('WeatherService (with a stubbed transport)', () => {
  let get: ReturnType<typeof vi.fn>;
  let service: WeatherService;

  beforeEach(() => {
    get = vi.fn();
    service = new WeatherService({ get } as unknown as WeatherTransport);
  });

  describe('getCurrentWeather()', () => {
    it('requests /forecast with the coordinates and current fields', async () => {
      get.mockResolvedValue({ status: 200, data: currentResponse });

      await service.getCurrentWeather(55.75, 37.62);

      expect(get).toHaveBeenCalledWith('/forecast', {
        data: {
          latitude: 55.75,
          longitude: 37.62,
          current: 'temperature_2m,wind_speed_10m,weather_code',
          timezone: 'auto',
        },
      });
    });

    it('maps the API response to a CurrentWeather object', async () => {
      get.mockResolvedValue({ status: 200, data: currentResponse });

      await expect(service.getCurrentWeather(55.75, 37.62)).resolves.toEqual({
        time: '2026-11-16T16:45',
        temperature: 3.4,
        windSpeed: 8.4,
        weatherCode: 1,
        description: 'Partly cloudy',
      });
    });

    it.each([
      [91, 0, /Latitude/],
      [-91, 0, /Latitude/],
      [0, 181, /Longitude/],
      [Number.NaN, 0, /Latitude/],
    ])('rejects invalid coordinates (%s, %s) without a request', async (lat, lon, message) => {
      await expect(service.getCurrentWeather(lat, lon)).rejects.toThrow(message);
      expect(get).not.toHaveBeenCalled();
    });

    it('rejects a response without "current"', async () => {
      get.mockResolvedValue({ status: 200, data: {} });
      await expect(service.getCurrentWeather(0, 0)).rejects.toThrow('"current" is missing');
    });

    it('turns an HTTPError into a readable message with the API reason', async () => {
      get.mockRejectedValue(new HTTPError('fail', 400, { error: true, reason: 'Bad latitude' }));
      await expect(service.getCurrentWeather(0, 0)).rejects.toThrow('Weather request failed (400): Bad latitude');
    });

    it('passes other errors through unchanged', async () => {
      const boom = new TypeError('boom');
      get.mockRejectedValue(boom);
      await expect(service.getCurrentWeather(0, 0)).rejects.toBe(boom);
    });
  });

  describe('getDailyForecast()', () => {
    it('requests the given number of days and maps each day', async () => {
      get.mockResolvedValue({ status: 200, data: dailyResponse });

      const days = await service.getDailyForecast(55.75, 37.62, 2);

      expect(get.mock.calls[0][1].data).toMatchObject({ forecast_days: 2 });
      expect(days).toEqual([
        { date: '2026-11-16', min: 0.6, max: 4.6, weatherCode: 3, description: 'Partly cloudy' },
        { date: '2026-11-17', min: -0.1, max: 1.4, weatherCode: 61, description: 'Rain' },
      ]);
    });

    it('defaults to 3 days', async () => {
      get.mockResolvedValue({ status: 200, data: dailyResponse });
      await service.getDailyForecast(0, 0);
      expect(get.mock.calls[0][1].data).toMatchObject({ forecast_days: 3 });
    });

    it.each([0, 17, 2.5])('rejects days=%s', async days => {
      await expect(service.getDailyForecast(0, 0, days)).rejects.toThrow(RangeError);
      expect(get).not.toHaveBeenCalled();
    });

    it('rejects a response without "daily"', async () => {
      get.mockResolvedValue({ status: 200, data: {} });
      await expect(service.getDailyForecast(0, 0)).rejects.toThrow('"daily" is missing');
    });
  });
});

describe('WeatherService over XHR (HTTPTransport + FakeXHR)', () => {
  beforeEach(() => FakeXHR.install());

  it('sends a real Open-Meteo URL and parses the JSON reply', async () => {
    const service = new WeatherService();
    const promise = service.getCurrentWeather(55.75, 37.62);

    const xhr = FakeXHR.last;
    expect(xhr.method).toBe('GET');
    const url = new URL(xhr.url);
    expect(`${url.origin}${url.pathname}`).toBe(`${WEATHER_API_URL}/forecast`);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      latitude: '55.75',
      longitude: '37.62',
      current: 'temperature_2m,wind_speed_10m,weather_code',
      timezone: 'auto',
    });

    xhr.respond(200, currentResponse);
    await expect(promise).resolves.toMatchObject({ temperature: 3.4, description: 'Partly cloudy' });
  });

  it('reports the Open-Meteo error reason on a 400', async () => {
    const promise = new WeatherService().getDailyForecast(10, 10);
    FakeXHR.last.respond(400, { error: true, reason: 'Parameter forecast_days is invalid' });

    await expect(promise).rejects.toThrow('Weather request failed (400): Parameter forecast_days is invalid');
  });

  it('reports a network failure', async () => {
    const promise = new WeatherService().getCurrentWeather(10, 10);
    FakeXHR.last.failNetwork();

    await expect(promise).rejects.toThrow('Weather request failed (0): Network error');
  });
});
