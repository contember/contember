import * as Koa from 'koa'
import * as koaCompose from 'koa-compose'

export type KoaContext<T> = Koa.ParameterizedContext<T>
export type KoaMiddleware<T> = Koa.Middleware<T>
