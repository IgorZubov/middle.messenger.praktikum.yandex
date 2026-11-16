export const METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export type Method = (typeof METHODS)[keyof typeof METHODS];

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: Method;
  headers?: Record<string, string>;
  /** Query parameters for GET, request body for the other methods. */
  data?: unknown;
  /** Milliseconds; 0 means no timeout. */
  timeout?: number;
  withCredentials?: boolean;
}

export type MethodOptions = Omit<RequestOptions, 'method'>;

export interface HTTPResponse<T> {
  status: number;
  data: T;
}

export class HTTPError extends Error {
  readonly status: number;

  readonly data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = 'HTTPError';
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_TIMEOUT = 5000;

/** { a: 1, b: 'x y' } -> "?a=1&b=x%20y"; null/undefined values are skipped. */
export function queryStringify(data: Record<string, QueryValue>): string {
  const pairs = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return pairs.length ? `?${pairs.join('&')}` : '';
}

function parseBody(xhr: XMLHttpRequest): unknown {
  const contentType = xhr.getResponseHeader('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(xhr.responseText);
    } catch {
      return xhr.responseText;
    }
  }
  return xhr.responseText;
}

export default class HTTPTransport {
  private baseURL: string;

  constructor(baseURL = '') {
    this.baseURL = baseURL.replace(/\/+$/, '');
  }

  get = <T>(url: string, options: MethodOptions = {}) =>
    this.request<T>(url, { ...options, method: METHODS.GET });

  post = <T>(url: string, options: MethodOptions = {}) =>
    this.request<T>(url, { ...options, method: METHODS.POST });

  put = <T>(url: string, options: MethodOptions = {}) =>
    this.request<T>(url, { ...options, method: METHODS.PUT });

  patch = <T>(url: string, options: MethodOptions = {}) =>
    this.request<T>(url, { ...options, method: METHODS.PATCH });

  delete = <T>(url: string, options: MethodOptions = {}) =>
    this.request<T>(url, { ...options, method: METHODS.DELETE });

  request<T>(url: string, options: RequestOptions = {}): Promise<HTTPResponse<T>> {
    const {
      method = METHODS.GET,
      headers = {},
      data,
      timeout = DEFAULT_TIMEOUT,
      withCredentials = false,
    } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const isGet = method === METHODS.GET;
      const query = isGet && data ? queryStringify(data as Record<string, QueryValue>) : '';

      xhr.open(method, `${this.baseURL}${url}${query}`);
      xhr.timeout = timeout;
      xhr.withCredentials = withCredentials;

      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      const hasBody = !isGet && data !== undefined;
      const requestHeaders: Record<string, string> = { ...headers };
      const hasContentType = Object.keys(requestHeaders).some(h => h.toLowerCase() === 'content-type');
      if (hasBody && !isFormData && !hasContentType) {
        requestHeaders['Content-Type'] = 'application/json';
      }
      Object.entries(requestHeaders).forEach(([key, value]) => xhr.setRequestHeader(key, value));

      xhr.onload = () => {
        const body = parseBody(xhr);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ status: xhr.status, data: body as T });
        } else {
          reject(new HTTPError(`Request failed with status ${xhr.status}`, xhr.status, body));
        }
      };
      xhr.onerror = () => reject(new HTTPError('Network error', 0));
      xhr.ontimeout = () => reject(new HTTPError(`Request timed out after ${timeout} ms`, 0));
      xhr.onabort = () => reject(new HTTPError('Request aborted', 0));

      if (!hasBody) {
        xhr.send();
      } else if (isFormData) {
        xhr.send(data as FormData);
      } else {
        xhr.send(JSON.stringify(data));
      }
    });
  }
}
