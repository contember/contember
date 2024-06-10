---
title: Caching
---


## `x-contember-ref` Header for Caching Responses

The `x-contember-ref` header allows for efficient caching of Contember responses. It works by providing a way for the client to ask the server whether the current server state has changed since the last time it was requested.

It works by providing a unique identifier for the latest known event that has occurred in the system. This identifier can be included in subsequent requests as a means of specifying that the client already has the latest data.
If the ID provided in the request matches the latest ID in the server's event log, the server can respond with a `304 Not Modified` status code, indicating that the client already has the latest data and no further action is needed. This can significantly improve performance by reducing the amount of unnecessary queries and transfered data.

The `x-contember-ref` header can be especially useful in environments where data is expected to change infrequently, such as in a publishing platform where new posts are only added periodically. By using the `x-contember-ref header`, clients can avoid unnecessary data transfer and improve performance.

### Sending a request

To use the `x-contember-ref` header, in first request include it in your request with any non-empty value (e.g. `1`). The server will then respond with a `x-contember-ref` header containing the UUID of the latest known event. This value should be saved and included in subsequent requests to take advantage of the caching behavior.

### Example flow

#### Initial request

```
GET /content/my-project/live
x-contember-ref: 1
```

#### Response

```
200 OK
x-contember-ref: 2897c7ef-5407-4c1f-a45b-09f64bd050d8
```

#### Subsequent request with event ID from previous response

```
GET /content/my-project/live
x-contember-ref: 2897c7ef-5407-4c1f-a45b-09f64bd050d8
```

#### Response with 304 Not Modified

```
304 Not Modified
```

If the ID provided in the request does not match the latest known event on the server, the server will execute the query and return the latest data and a new ID value in the `x-contember-ref` header. This allows the client to update its cached data and continue using the ID for efficient caching in the future.

#### Request with stale ID

```
GET /content/my-project/live
x-contember-ref: 2897c7ef-5407-4c1f-a45b-09f64bd050d8
```

#### Response with updated data and new ID

```
200 OK
x-contember-ref: 37e7dfd1-5fbb-4c53-a56d-395fb5f2119a
```
