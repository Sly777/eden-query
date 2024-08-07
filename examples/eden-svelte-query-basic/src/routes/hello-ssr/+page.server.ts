import { httpBatchLink } from '@elysiajs/eden-svelte-query'
import { QueryClient } from '@tanstack/svelte-query'
import SuperJSON from 'superjson'

import { eden } from '$lib/eden'

import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async (event) => {
  const client = eden.createClient({
    links: [
      httpBatchLink({
        endpoint: '/api/batch',
        transformer: SuperJSON,
        fetcher: event.fetch,
      }),
    ],
  })

  const utils = eden.createUtils(
    {
      client,
      queryClient: new QueryClient(),
    },
    {
      dehydrated: event.locals.dehydrated,
    },
  )

  const result = await utils.api.index.get.fetch({})

  console.log('SSR result: ', result)
}
