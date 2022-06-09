import * as Koa from 'koa'

export type KoaContext<State> = Koa.ExtendableContext & { state: State; compress?: boolean }
type KoaNext = () => Promise<any>
export type KoaMiddleware<State> = (context: KoaContext<State>, next: KoaNext) => any
