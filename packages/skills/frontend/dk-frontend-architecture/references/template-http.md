# Template: `src/infra/http/`

Complete, copyable implementation of the cross-cutting HTTP client. Written **once** per project. See the layer's responsibility in [SKILL.md](../SKILL.md).

## `fetch.ts`

Native `fetch` wrapper: normalizes the body, throws an error if the response isn't `ok`, no domain logic.

```ts
type URLString = `http://${string}` | `https://${string}`;

export type RequestOptions = {
  body?: BodyInit | object;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  headers?: HeadersInit;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  params?: object;
  signal?: AbortSignal;
};

export interface FetchResponse<ApiResponse> extends Response {
  json: () => Promise<ApiResponse>;
}

const getBodyRequest = (body: RequestOptions["body"]): BodyInit | undefined => {
  if (typeof body === "object") {
    return JSON.stringify(body);
  }
  return body;
};

export const fetchWrapper = async <Res>(
  url: URLString,
  options?: RequestOptions,
): Promise<FetchResponse<Res>> => {
  const request = getBodyRequest(options?.body);
  const response = await fetch(url, { ...options, body: request });

  if (!response.ok) {
    throw new Error(
      `Fetch failed: ${String(response.status)}, statusText: ${response.statusText}`,
    );
  }

  return response;
};

export type { URLString };
```

## `index.ts`

Adapter that types and builds the URL (baseURL + params), exposes HTTP verbs, and exports concrete instances per external API domain (baseURL + headers fixed once).

```ts
import {
  fetchWrapper,
  type RequestOptions,
  type FetchResponse,
  type URLString,
} from "./fetch";

interface FetcherParams
  extends Pick<RequestOptions, "cache" | "credentials" | "headers"> {
  baseURL: URLString;
}

type ReqOptions = Omit<RequestOptions, "method">;

const getURLWithParams = (url: string, params?: object): URLString => {
  if (!params || Object.keys(params).length === 0) {
    return url as URLString;
  }
  const searchParams = new URLSearchParams(params as Record<string, string>);
  return `${url}?${searchParams.toString()}` as URLString;
};

const fetchAdapter = ({
  baseURL,
  headers: instanceHeader,
  ...instanceRestConfig
}: FetcherParams) => {
  return {
    get: <Res>(
      url: `/${string}`,
      options?: ReqOptions,
    ): Promise<FetchResponse<Res>> => {
      const finalUrl = getURLWithParams(`${baseURL}${url}`, options?.params);
      return fetchWrapper<Res>(finalUrl, {
        ...instanceRestConfig,
        ...options,
        headers: { ...instanceHeader, ...options?.headers },
        method: "GET",
      });
    },
    post: <Res>(
      url: `/${string}`,
      options?: ReqOptions,
    ): Promise<FetchResponse<Res>> => {
      const finalUrl = getURLWithParams(`${baseURL}${url}`, options?.params);
      return fetchWrapper<Res>(finalUrl, {
        ...instanceRestConfig,
        ...options,
        headers: { ...instanceHeader, ...options?.headers },
        method: "POST",
      });
    },
    put: <Res>(
      url: `/${string}`,
      options?: ReqOptions,
    ): Promise<FetchResponse<Res>> => {
      const finalUrl = getURLWithParams(`${baseURL}${url}`, options?.params);
      return fetchWrapper<Res>(finalUrl, {
        ...instanceRestConfig,
        ...options,
        headers: { ...instanceHeader, ...options?.headers },
        method: "PUT",
      });
    },
    delete: <Res>(
      url: `/${string}`,
      options?: ReqOptions,
    ): Promise<FetchResponse<Res>> => {
      const finalUrl = getURLWithParams(`${baseURL}${url}`, options?.params);
      return fetchWrapper<Res>(finalUrl, {
        ...instanceRestConfig,
        ...options,
        headers: { ...instanceHeader, ...options?.headers },
        method: "DELETE",
      });
    },
    patch: <Res>(
      url: `/${string}`,
      options?: ReqOptions,
    ): Promise<FetchResponse<Res>> => {
      const finalUrl = getURLWithParams(`${baseURL}${url}`, options?.params);
      return fetchWrapper<Res>(finalUrl, {
        ...instanceRestConfig,
        ...options,
        headers: { ...instanceHeader, ...options?.headers },
        method: "PATCH",
      });
    },
  };
};

// Example: one instance per external API domain identified.
const BASE_EXAMPLE_HEADERS = {
  Accept: "application/json",
};

export const restExampleApi = fetchAdapter({
  baseURL: "https://api.example.com",
  headers: BASE_EXAMPLE_HEADERS,
});
```

`fetchAdapter` and `fetchWrapper` are written **once** per project. A new external API domain (another backend, another microservice) is just a new call to `fetchAdapter({...})` exported here — never a loose new `fetch` in a `.adapter.ts`.
