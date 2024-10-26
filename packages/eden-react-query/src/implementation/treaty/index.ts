import type {
  EdenClient,
  EdenCreateClient,
  EdenRequestOptions,
  ExtractEdenTreatyRouteParams,
  ExtractEdenTreatyRouteParamsInput,
  HttpBatchLinkOptions,
  HTTPLinkOptions,
  HttpMutationMethod,
  HttpQueryMethod,
  HttpSubscriptionMethod,
  InferRouteOptions,
} from '@ap0nia/eden'
import type { AnyElysia, RouteSchema } from 'elysia'
import type { Prettify } from 'elysia/types'

import type { EdenQueryConfig } from '../../config'
import type { EdenContextProps, EdenContextState, EdenProvider } from '../../context'
import type { EdenUseInfiniteQuery } from '../../integration/hooks/use-infinite-query'
import type { EdenUseMutation } from '../../integration/hooks/use-mutation'
import type { EdenUseQuery } from '../../integration/hooks/use-query'
import type { EdenUseSuspenseInfiniteQuery } from '../../integration/hooks/use-suspense-infinite-query'
import type { EdenUseSuspenseQuery } from '../../integration/hooks/use-suspense-query'
import type { InfiniteCursorKey } from '../../integration/internal/infinite-query'
import type {
  EdenMutationKey,
  EdenQueryKey,
  EdenQueryKeyOptions,
  EdenQueryType,
} from '../../integration/internal/query-key'
import {
  getMutationKey as internalGetMutationKey,
  getQueryKey as internalGetQueryKey,
} from '../../integration/internal/query-key'
import type { LiteralUnion } from '../../utils/literal-union'
import { getPathParam } from '../../utils/path-param'
import type { EdenTreatyQueryUtils } from './query-utils'
import { createEdenTreatyQueryRootHooks, type EdenTreatyQueryRootHooks } from './root-hooks'
import type { EdenTreatyUseQueries } from './use-queries'
import type { EdenTreatyUseSuspenseQueries } from './use-suspense-queries'

export type EdenTreatyReactQuery<TElysia extends AnyElysia, TSSRContext> = EdenTreatyReactQueryBase<
  TElysia,
  TSSRContext
> &
  EdenTreatyReactQueryHooks<TElysia>

export type EdenTreatyReactQueryBase<TElysia extends AnyElysia, TSSRContext> = {
  createContext(
    props: EdenContextProps<TElysia, TSSRContext>,
  ): EdenContextState<TElysia, TSSRContext>

  createUtils(
    props: EdenContextProps<TElysia, TSSRContext>,
  ): EdenTreatyQueryUtils<TElysia, TSSRContext>

  /**
   * @deprecated renamed to `useUtils` and will be removed in a future tRPC version
   *
   * @link https://trpc.io/docs/v11/client/react/useUtils
   */
  useContext(): EdenTreatyQueryUtils<TElysia, TSSRContext>

  /**
   * @link https://trpc.io/docs/v11/client/react/useUtils
   */
  useUtils(): EdenTreatyQueryUtils<TElysia, TSSRContext>

  Provider: EdenProvider<TElysia, TSSRContext>

  useQueries: EdenTreatyUseQueries<TElysia>

  useSuspenseQueries: EdenTreatyUseSuspenseQueries<TElysia>

  /**
   * Need to provide `links` in order for this client to work.
   */
  createClient: EdenCreateClient<TElysia>

  /**
   * Convenience method for creating and configuring a client with a single HTTPLink.
   */
  createHttpClient: (options?: HTTPLinkOptions<TElysia>) => EdenClient<TElysia>

  /**
   * Convenience method for creating and configuring a client with a single HttpBatchLink.
   */
  createHttpBatchClient: (options?: HttpBatchLinkOptions<TElysia>) => EdenClient<TElysia>
}

export type EdenTreatyReactQueryHooks<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatyReactQueryHooksImplementation<TSchema>
  : 'Please install Elysia before using Eden'

export type EdenTreatyReactQueryHooksImplementation<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> = EdenTreatyReactQueryHooksProxy<TSchema, TPath, TRouteParams> &
  ({} extends TRouteParams
    ? {}
    : (
        params: ExtractEdenTreatyRouteParamsInput<TRouteParams>,
      ) => EdenTreatyReactQueryHooksImplementation<
        TSchema[Extract<keyof TRouteParams, keyof TSchema>],
        TPath
      >)

export type EdenTreatyReactQueryHooksProxy<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
  TRouteParams = ExtractEdenTreatyRouteParams<TSchema>,
> = {
  [K in Exclude<keyof TSchema, keyof TRouteParams>]: TSchema[K] extends RouteSchema
    ? EdenTreatyReactQueryRouteHooks<TSchema[K], K, TPath>
    : EdenTreatyReactQueryHooksImplementation<TSchema[K], [...TPath, K]>
}

/**
 * Maps a {@link RouteSchema} to an object with hooks.
 *
 * Defines available hooks for a specific route.
 *
 * @example { useQuery: ..., useInfiniteQuery: ... }
 */
export type EdenTreatyReactQueryRouteHooks<
  TRoute extends RouteSchema,
  TMethod,
  TPath extends any[] = [],
> = TMethod extends HttpQueryMethod
  ? EdenTreatyQueryMapping<TRoute, TPath>
  : TMethod extends HttpMutationMethod
    ? EdenTreatyMutationMapping<TRoute, TPath>
    : TMethod extends HttpSubscriptionMethod
      ? EdenTreatySubscriptionMapping<TRoute, TPath>
      : // Just add all possible operations since the route is unknown.
        EdenTreatyQueryMapping<TRoute, TPath> &
          EdenTreatyMutationMapping<TRoute, TPath> &
          EdenTreatySubscriptionMapping<TRoute, TPath>

/**
 * Available hooks assuming that the route supports useQuery.
 */
export type EdenTreatyQueryMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
> = {
  useQuery: EdenUseQuery<TRoute, TPath>
  useSuspenseQuery: EdenUseSuspenseQuery<TRoute, TPath>
} & (InfiniteCursorKey extends keyof (TInput['params'] & TInput['query'])
  ? EdenTreatyInfiniteQueryMapping<TRoute, TPath>
  : {})

/**
 * Available hooks assuming that the route supports useInfiniteQuery.
 */
export type EdenTreatyInfiniteQueryMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  useInfiniteQuery: EdenUseInfiniteQuery<TRoute, TPath>
  useSuspenseInfiniteQuery: EdenUseSuspenseInfiniteQuery<TRoute, TPath>
}

/**
 * Available hooks assuming that the route supports useMutation.
 */
export type EdenTreatyMutationMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  useMutation: EdenUseMutation<TRoute, TPath>
}

/**
 * @TODO: Available hooks assuming that the route supports useMutation.
 */
export type EdenTreatySubscriptionMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
> = {
  options: Prettify<EdenRequestOptions & TInput>
  queryKey: EdenQueryKey<TPath>
}

export function createEdenTreatyReactQuery<TElysia extends AnyElysia, TSSRContext = unknown>(
  config?: EdenQueryConfig<TElysia>,
): EdenTreatyReactQuery<TElysia, TSSRContext> {
  const rootHooks = createEdenTreatyQueryRootHooks(config)

  const edenTreatyReactQueryProxy = createEdenTreatyReactQueryProxy(rootHooks, config)

  const edenTreatyQuery = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      if (Object.prototype.hasOwnProperty.call(rootHooks, path)) {
        return rootHooks[path as never]
      }
      return edenTreatyReactQueryProxy[path as never]
    },
  })

  return edenTreatyQuery as any
}

export function createEdenTreatyReactQueryProxy<T extends AnyElysia = AnyElysia>(
  rootHooks: EdenTreatyQueryRootHooks<T>,
  config?: EdenQueryConfig<T>,
  paths: string[] = [],
  pathParams: Record<string, any>[] = [],
) {
  const edenTreatyQueryProxy = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createEdenTreatyReactQueryProxy(rootHooks, config, nextPaths, pathParams)
    },
    apply: (_target, _thisArg, args) => {
      const pathsCopy = [...paths]

      const pathParam = getPathParam(args)

      const hook = pathsCopy.pop() ?? ''

      const isRootProperty = Object.prototype.hasOwnProperty.call(rootHooks, hook)

      if (pathParam?.key != null && !isRootProperty) {
        const allPathParams = [...pathParams, pathParam.param]
        const pathsWithParams = [...paths, `:${pathParam.key}`]
        return createEdenTreatyReactQueryProxy(rootHooks, config, pathsWithParams, allPathParams)
      }

      /**
       * Hidden internal hook that returns the path array up to this point.
       */
      if (hook === '_defs') {
        return pathsCopy
      }

      // There is no option to pass in input from the public exposed hook,
      // but the internal root `useMutation` hook expects input as the first argument.
      // Add an empty element at the front representing "input".
      if (hook === 'useMutation') {
        args.unshift(undefined)
      }

      const modifiedArgs = mutateArgs(hook, args, pathParams)

      /**
       * ```ts
       * // The final hook that was invoked.
       * const hook = "useQuery"
       *
       * // The array of path segments up to this point.
       * // Note how ":id" is included, this will be replaced by the `resolveRequest` function from eden.
       * const pathsCopy = ["nendoroid", ":id", "name"]
       *
       * // Accummulated path parameters up to this point.
       * const pathParams = [ { id: 1895 } ]
       *
       * // The user provided a search query and query options.
       * const args = [ { location: "jp" }, { refetchOnUnmount: true } ]
       *
       * // The accummulated path parameters and search query are merged into one "input" object.
       * const modifiedArgs = [
       *   { query: { location: "jp" }, params: { id: 1895 } },
       *   { refetchOnMount: false }
       * ]
       *
       * // The full function call contains three arguments:
       * // array of path segments, input, and query options.
       * rootHooks.useQuery(
       *   ["nendoroid", ":id", "name"],
       *   { query: { location: "jp" }, params: { id: 1895 } },
       *   { refetchOnMount: false }
       * )
       * ```
       */
      const result = (rootHooks as any)[hook](pathsCopy, ...modifiedArgs)

      return result
    },
  })

  return edenTreatyQueryProxy
}

export function getQueryKey<TSchema extends Record<string, any>>(
  route: EdenTreatyReactQueryHooksImplementation<TSchema>,
  input?: TSchema extends RouteSchema ? InferRouteOptions<TSchema> : any,
  type?: EdenQueryType,
): EdenQueryKey {
  const paths = (route as any).defs()
  return internalGetQueryKey(paths, input, type ?? 'any')
}

export function getMutationKey<TSchema extends RouteSchema>(
  route: EdenTreatyReactQueryHooksImplementation<TSchema>,
  options?: EdenQueryKeyOptions,
): EdenMutationKey {
  const paths = (route as any).defs()
  return internalGetMutationKey(paths, options)
}

/**
 * Some hooks have `input` provided as the first argument to the root hook.
 * If this is the case, then {@link mutateArgs} needs to ensure that any
 * accummulated path parameters are included.
 */
const hooksWithInput: (keyof EdenTreatyQueryRootHooks | LiteralUnion<string>)[] = [
  'useQuery',
  'useInfiniteQuery',
  'useSuspenseQuery',
  'useSuspenseInfiniteQuery',
  'useMutation',
]

/**
 * Directly mutate the arguments passed to the root hooks.
 *
 * Make sure that the interpretation of args matches up with the implementation of root hooks.
 */
export function mutateArgs(
  hook: keyof EdenTreatyQueryRootHooks | LiteralUnion<string>,
  args: unknown[],
  params: Record<string, any>[],
) {
  if (!hooksWithInput.includes(hook)) {
    return args
  }

  const query = args[0]

  if (query == null && params.length === 0) {
    return args
  }

  const resolvedParams: Record<string, any> = {}

  for (const param of params) {
    for (const key in param) {
      resolvedParams[key] = param[key]
    }
  }

  const resolvedInput = {
    params: resolvedParams,
    query,
  }

  args[0] = resolvedInput

  return args
}

export * from './infer'
export * from './query-utils'
export * from './root-hooks'
export * from './use-queries'
export * from './use-suspense-queries'
