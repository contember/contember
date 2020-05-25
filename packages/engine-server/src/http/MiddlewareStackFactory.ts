import Koa from 'koa'
import { TimerMiddlewareFactory } from './TimerMiddlewareFactory'
import { HomepageMiddlewareFactory } from './HomepageMiddlewareFactory'
import { ContentMiddlewareFactory } from './content'
import { TenantMiddlewareFactory } from './tenant'
import { SystemMiddlewareFactory } from './system'
import { compose, KoaMiddleware, route } from '../core/koa'
import { PlaygroundMiddlewareFactory } from './PlaygroundMiddlewareFactory'
import { ErrorResponseMiddlewareFactory } from './ErrorResponseMiddlewareFactory'

export class MiddlewareStackFactory {
	constructor(
		private readonly timerMiddlewareFactory: TimerMiddlewareFactory,
		private readonly errorResponseMiddlewareFactory: ErrorResponseMiddlewareFactory,
		private readonly homepageMiddlewareFactory: HomepageMiddlewareFactory,
		private readonly contentMiddlewareFactory: ContentMiddlewareFactory,
		private readonly tenantMiddlewareFactory: TenantMiddlewareFactory,
		private readonly systemMiddlewareFactory: SystemMiddlewareFactory,
		private readonly collectMetricsMiddlewareFactory: () => KoaMiddleware<any>,
	) {}

	create(): Koa.Middleware {
		return compose([
			this.collectMetricsMiddlewareFactory(),
			this.errorResponseMiddlewareFactory.create(),
			this.timerMiddlewareFactory.create(),
			route('/playground$', new PlaygroundMiddlewareFactory().create()),
			this.homepageMiddlewareFactory.create(),
			this.contentMiddlewareFactory.create(),
			this.tenantMiddlewareFactory.create(),
			this.systemMiddlewareFactory.create(),
		])
	}
}
