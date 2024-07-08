import * as promClient from 'prom-client'

declare module 'prom-client' {
	export type Collector = () => void

	interface Registry {
		/**
		 * Add metric collector, which is invoked on scrape
		 */
		registerCollector(collectorFn: Collector): void

		/**
		 * Get all registered collector functions
		 */
		collectors(): Collector[]
	}
}
