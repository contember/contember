import Koa from 'koa'
import TimerMiddlewareFactory from './TimerMiddlewareFactory'
import HomepageMiddlewareFactory from './HomepageMiddlewareFactory'
import ContentMiddlewareFactory from './ContentMiddlewareFactory'
import TenantMiddlewareFactory from './TenantMiddlewareFactory'
import SystemMiddlewareFactory from './SystemMiddlewareFactory'
import { compose } from '../core/koa/compose'

class MiddlewareStackFactory {
	constructor(
		private readonly timerMiddlewareFactory: TimerMiddlewareFactory,
		private readonly homepageMiddlewareFactory: HomepageMiddlewareFactory,
		private readonly contentMiddlewareFactory: ContentMiddlewareFactory,
		private readonly tenantMiddlewareFactory: TenantMiddlewareFactory,
		private readonly systemMiddlewareFactory: SystemMiddlewareFactory
	) {}

	create(): Koa.Middleware {
		return compose([
			this.timerMiddlewareFactory.create(),
			this.homepageMiddlewareFactory.create(),
			this.contentMiddlewareFactory.create(),
			this.tenantMiddlewareFactory.create(),
			this.systemMiddlewareFactory.create(),
		])
	}
}

export default MiddlewareStackFactory
