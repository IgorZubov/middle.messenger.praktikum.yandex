import { vi } from 'vitest';

/**
 * A minimal hand-written XMLHttpRequest double.
 * It records what the code under test sent and lets the test decide
 * how the "server" answers: respond(), failNetwork(), triggerTimeout(), abort().
 */
export default class FakeXHR {
  /** Every instance created while installed, newest last. */
  static instances: FakeXHR[] = [];

  static install(): void {
    FakeXHR.instances = [];
    vi.stubGlobal('XMLHttpRequest', FakeXHR);
  }

  static get last(): FakeXHR {
    const xhr = FakeXHR.instances[FakeXHR.instances.length - 1];
    if (!xhr) {
      throw new Error('No XMLHttpRequest was created');
    }
    return xhr;
  }

  method = '';

  url = '';

  requestHeaders: Record<string, string> = {};

  body: Document | XMLHttpRequestBodyInit | null | undefined = undefined;

  sent = false;

  timeout = 0;

  withCredentials = false;

  status = 0;

  responseText = '';

  private responseHeaders: Record<string, string> = {};

  onload: (() => void) | null = null;

  onerror: (() => void) | null = null;

  ontimeout: (() => void) | null = null;

  onabort: (() => void) | null = null;

  constructor() {
    FakeXHR.instances.push(this);
  }

  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string): void {
    this.requestHeaders[name] = value;
  }

  send(body?: Document | XMLHttpRequestBodyInit | null): void {
    this.body = body;
    this.sent = true;
  }

  getResponseHeader(name: string): string | null {
    const key = Object.keys(this.responseHeaders).find(h => h.toLowerCase() === name.toLowerCase());
    return key ? this.responseHeaders[key] : null;
  }

  abort(): void {
    this.onabort?.();
  }

  // --- test controls ---------------------------------------------------

  respond(status: number, body: unknown, headers: Record<string, string> = {}): void {
    const isText = typeof body === 'string';
    this.status = status;
    this.responseText = isText ? body : JSON.stringify(body);
    this.responseHeaders = isText ? headers : { 'Content-Type': 'application/json', ...headers };
    this.onload?.();
  }

  failNetwork(): void {
    this.onerror?.();
  }

  triggerTimeout(): void {
    this.ontimeout?.();
  }
}
