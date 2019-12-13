import * as Koa from 'koa'

export type KoaContext<T> = Koa.ParameterizedContext<T>
export type KoaMiddleware<T> = Koa.Middleware<T>
