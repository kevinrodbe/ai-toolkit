# Fetch adapter

It provides methods for making API calls (GET, POST, PUT, DELETE, PATCH) with consistent error handling and type definitions. Copy the code below as-is — no modifications needed.

In: `./{projectRoot}/src/infra/http/index.ts`

```ts
import { fetchWrapper, type RequestOptions, type FetchResponse } from './fetch';

interface FetcherParams extends Pick<RequestOptions, 'cache' | 'credentials' | 'headers'> {
  baseURL: URLString;
}

type ReqOptions = Omit<RequestOptions, 'method'>;

const fetchAdapter = ({
  baseURL,
  headers: instanceHeader,
  ...instanceRestConfig
}: FetcherParams) => {
  return {
    get: <Res>(url: `/${string}`, options: ReqOptions): Promise<FetchResponse<Res>> => {
      const finalUrl = getURLWithParams(`${baseURL}${url}`, options?.params);

      return fetchWrapper<Res>(finalUrl, {
        ...instanceRestConfig,
        ...options,
        headers: { ...instanceHeader, ...options?.headers },
        method: 'GET',
      });
    },
    post: <Res>(url: `/${string}`, options?: ReqOptions): Promise<FetchResponse<Res>> => {
      const finalUrl = getURLWithParams(`${baseURL}${url}`, options?.params);

      return fetchWrapper<Res>(finalUrl, {
        ...instanceRestConfig,
        ...options,
        headers: { ...instanceHeader, ...options?.headers },
        method: 'POST',
      });
    },
    put: <Res>(url: `/${string}`, options?: ReqOptions): Promise<FetchResponse<Res>> => {
      const finalUrl = getURLWithParams(`${baseURL}${url}`, options?.params);

      return fetchWrapper(finalUrl, {
        ...instanceRestConfig,
        ...options,
        headers: { ...instanceHeader, ...options?.headers },
        method: 'PUT',
      });
    },
    delete: <Res>(url: `/${string}`, options?: ReqOptions): Promise<FetchResponse<Res>> => {
      const finalUrl = getURLWithParams(`${baseURL}${url}`, options?.params);

      return fetchWrapper(finalUrl, {
        ...instanceRestConfig,
        ...options,
        headers: { ...instanceHeader, ...options?.headers },
        method: 'DELETE',
      });
    },
    patch: <Res>(url: `/${string}`, options?: ReqOptions): Promise<FetchResponse<Res>> => {
      const finalUrl = getURLWithParams(`${baseURL}${url}`, options?.params);

      return fetchWrapper(finalUrl, {
        ...instanceRestConfig,
        ...options,
        headers: { ...instanceHeader, ...options?.headers },
        method: 'PATCH',
      });
    },
  };
};
```
