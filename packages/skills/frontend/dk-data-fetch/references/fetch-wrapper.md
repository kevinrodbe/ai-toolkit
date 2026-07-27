# Fetch Wrapper

Typed fetch utility. Copy the code below as-is — no modifications needed.

In: `./{projectRoot}/src/infra/http/fetch.ts`

```ts
type URLString = `http://${string}` | `https://${string}`;

export type RequestOptions = {
  body?: BodyInit | object;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  headers?: HeadersInit;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: object;
  signal?: AbortSignal;
};

export interface FetchResponse<ApiResponse> extends Response {
  json: () => Promise<ApiResponse>;
}

const getBodyRequest = (body: RequestOptions['body']): BodyInit | undefined => {
  if (typeof body === 'object') {
    return JSON.stringify(body);
  }
  return body;
};

export const fetchWrapper = async <Res>(
  url: URLString,
  options?: RequestOptions
): Promise<FetchResponse<Res>> => {
  const request = getBodyRequest(options?.body);
  const response = await fetch(url, { ...options, body: request });

  if (!response.ok) {
    throw new Error(`Fetch failed: ${String(response.status)}, statusText: ${response.statusText}`);
  }

  return response;
};
```
