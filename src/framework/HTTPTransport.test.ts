import { beforeEach, describe, expect, it } from 'vitest';
import HTTPTransport, { HTTPError, queryStringify } from './HTTPTransport';
import FakeXHR from '../test-utils/FakeXHR';

describe('queryStringify', () => {
  it('builds a query string from an object', () => {
    expect(queryStringify({ a: 1, b: 'two' })).toBe('?a=1&b=two');
  });

  it('encodes keys and values', () => {
    expect(queryStringify({ 'q s': 'a&b=c', list: 'x,y' })).toBe('?q%20s=a%26b%3Dc&list=x%2Cy');
  });

  it('skips null and undefined values and keeps falsy primitives', () => {
    expect(queryStringify({ a: null, b: undefined, c: 0, d: false, e: '' })).toBe('?c=0&d=false&e=');
  });

  it('returns an empty string for an empty object', () => {
    expect(queryStringify({})).toBe('');
  });
});

describe('HTTPTransport', () => {
  let http: HTTPTransport;

  beforeEach(() => {
    FakeXHR.install();
    http = new HTTPTransport('https://api.example.com/');
  });

  describe('building the request', () => {
    it('joins the base URL and path and turns GET data into a query string', () => {
      http.get('/forecast', { data: { latitude: 55.75, longitude: 37.62 } });

      expect(FakeXHR.last.method).toBe('GET');
      expect(FakeXHR.last.url).toBe('https://api.example.com/forecast?latitude=55.75&longitude=37.62');
      expect(FakeXHR.last.body).toBeUndefined();
    });

    it.each([
      ['post', 'POST'],
      ['put', 'PUT'],
      ['patch', 'PATCH'],
      ['delete', 'DELETE'],
    ] as const)('%s() sends a %s request with a JSON body', (method, expected) => {
      http[method]('/items', { data: { title: 'Hello' } });

      expect(FakeXHR.last.method).toBe(expected);
      expect(FakeXHR.last.url).toBe('https://api.example.com/items');
      expect(FakeXHR.last.body).toBe('{"title":"Hello"}');
      expect(FakeXHR.last.requestHeaders['Content-Type']).toBe('application/json');
    });

    it('does not put a body into the query string for non-GET requests', () => {
      http.post('/items', { data: { a: 1 } });
      expect(FakeXHR.last.url).not.toContain('?');
    });

    it('sends FormData as is, without a JSON Content-Type', () => {
      const form = new FormData();
      form.append('avatar', 'file');

      http.put('/avatar', { data: form });

      expect(FakeXHR.last.body).toBe(form);
      expect(FakeXHR.last.requestHeaders['Content-Type']).toBeUndefined();
    });

    it('passes custom headers and does not override a custom Content-Type', () => {
      http.post('/text', { data: 'raw', headers: { 'content-type': 'text/plain', 'X-Token': 'abc' } });

      expect(FakeXHR.last.requestHeaders).toEqual({ 'content-type': 'text/plain', 'X-Token': 'abc' });
    });

    it('applies the default timeout and an explicit one', () => {
      http.get('/a');
      expect(FakeXHR.last.timeout).toBe(5000);

      http.get('/b', { timeout: 100 });
      expect(FakeXHR.last.timeout).toBe(100);
    });

    it('sets withCredentials when asked', () => {
      http.get('/me', { withCredentials: true });
      expect(FakeXHR.last.withCredentials).toBe(true);
    });

    it('sends the request right away', () => {
      http.get('/a');
      expect(FakeXHR.last.sent).toBe(true);
    });
  });

  describe('handling the response', () => {
    it('resolves with the status and parsed JSON for a 2xx response', async () => {
      const promise = http.get<{ ok: boolean }>('/a');
      FakeXHR.last.respond(200, { ok: true });

      await expect(promise).resolves.toEqual({ status: 200, data: { ok: true } });
    });

    it('resolves with plain text when the response is not JSON', async () => {
      const promise = http.get<string>('/a');
      FakeXHR.last.respond(201, 'created', { 'Content-Type': 'text/plain' });

      await expect(promise).resolves.toEqual({ status: 201, data: 'created' });
    });

    it('falls back to raw text when a JSON response cannot be parsed', async () => {
      const promise = http.get('/a');
      FakeXHR.last.respond(200, '{broken', { 'Content-Type': 'application/json' });

      await expect(promise).resolves.toEqual({ status: 200, data: '{broken' });
    });

    it('rejects with an HTTPError carrying the status and body for 4xx/5xx', async () => {
      const promise = http.get('/a');
      FakeXHR.last.respond(404, { reason: 'Not found' });

      const error = await promise.catch(e => e);
      expect(error).toBeInstanceOf(HTTPError);
      expect(error.status).toBe(404);
      expect(error.data).toEqual({ reason: 'Not found' });
    });

    it('rejects on a network error', async () => {
      const promise = http.get('/a');
      FakeXHR.last.failNetwork();

      await expect(promise).rejects.toThrow('Network error');
    });

    it('rejects on timeout', async () => {
      const promise = http.get('/a', { timeout: 100 });
      FakeXHR.last.triggerTimeout();

      await expect(promise).rejects.toThrow('Request timed out after 100 ms');
    });

    it('rejects when the request is aborted', async () => {
      const promise = http.get('/a');
      FakeXHR.last.abort();

      await expect(promise).rejects.toThrow('Request aborted');
    });
  });
});
