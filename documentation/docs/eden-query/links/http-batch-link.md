---
id: httpBatchLink
title: HTTP Batch Link
sidebar_label: HTTP Batch Link
slug: /client/links/httpBatchLink
---

# HTTP Batch Link

`httpBatchLink` is a [**terminating link**](./overview.md#the-terminating-link) that
batches an array of individual Eden requests into a single HTTP request that's sent
to a batch endpoint.

**_Ensure that your Elysia.js server application uses the batch plugin provided by this library._**

## Usage

You can import and add the `httpBatchLink` to the `links` array as such:

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

export const app = new Elysia().get('/', () => 'Hello, World!')

export type App = typeof app

// @filename: index.ts
// ---cut---
import { EdenClient, httpBatchLink } from '@elysiajs/eden-react-query'
import type { App } from './server'

const client = new EdenClient<App>({
  links: [
    httpBatchLink({
      domain: 'http://localhost:3000',
      // transformer,
    }),
  ],
})
```

After that, you can make use of batching by setting all your procedures in a `Promise.all`.
The code below will produce exactly **one** HTTP request and on the server exactly **one** database query:

```ts
const somePosts = await Promise.all([
  client.post.byId.get(1),
  client.post.byId.get(2),
  client.post.byId.get(3),
])
```

:::warning
The usage displayed above is WIP, not implemented yet...
:::

## `httpBatchLink` Options

The `httpBatchLink` function takes an options object that has the `HTTPBatchLinkOptions` shape.

```ts
export interface HTTPBatchLinkOptions extends HTTPLinkOptions {
  maxURLLength?: number
}

export interface HTTPLinkOptions {
  url: string
  /**
   * Add ponyfill for fetch
   */
  fetch?: typeof fetch

  /**
   * Add ponyfill for AbortController
   */
  AbortController?: typeof AbortController | null

  /**
   * Data transformer
   * @link https://trpc.io/docs/data-transformers
   **/
  transformer?: DataTransformerOptions

  /**
   * Headers to be set on outgoing requests or a callback that of said headers
   * @link http://trpc.io/docs/header
   */
  headers?: HTTPHeaders | ((opts: { opList: Operation[] }) => HTTPHeaders | Promise<HTTPHeaders>)
}
```

## Setting a maximum URL length

When sending batch requests **_via GET requests_** and encoding the information in the request query,
sometimes the URL can become too large, causing HTTP errors like
[`413 Payload Too Large`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413), [`414 URI Too Long`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414), and [`404 Not Found`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404). The `maxURLLength` option will limit the number of requests that can be sent together in a batch.

> An alternative way of adding an HTTP Batch Link is demonstrated below

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

export const app = new Elysia().get('/', () => 'Hello, World!')

export type App = typeof app

// @filename: index.ts
// ---cut---
import { EdenClient, httpBatchLink } from '@elysiajs/eden-react-query'
import type { App } from './server'

const client = new EdenClient<App>({
  links: [
    httpBatchLink({
      domain: 'http://localhost:3000',
      maxURLLength: 2083,
      method: 'GET',
      // transformer,
    }),
  ],
})
```

## Disabling request batching

### 1. Do not use the batch plugin.

> The batch plugin is opt-in.

### 2. Replace `httpBatchLink` with [`httpLink`](./http-link.md) in your Eden Client

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

export const app = new Elysia().get('/', () => 'Hello, World!')

export type App = typeof app

// @filename: index.ts
// ---cut---
import { EdenClient, httpLink } from '@elysiajs/eden-react-query'
import type { App } from './server'

const client = new EdenClient<App>({
  links: [
    httpLink({
      domain: 'http://localhost:3000',
      // transformer,
    }),
  ],
})
```

or, if you're using Next.js:

:::warning
There is no explicit Next.js support yet. This is an example of what it may look like.
:::

```tsx
import type { App } from '@/server/routers/app'
import { createEdenNext, httpLink } from '@elysiajs/eden-next'

export const eden = createEdenNext<App>({
  config() {
    return {
      links: [
        httpLink({
          url: '/api/trpc',
        }),
      ],
    }
  },
})
```