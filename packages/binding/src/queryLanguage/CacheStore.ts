import type { Environment } from '../dao'
import { LRUCache } from '../structures'
import type { Parser } from './Parser'

type CacheByEntryPoint = {
	[Entry in Parser.EntryPoint]: LRUCache<string, Parser.ParserResult[Entry]>
}

export class CacheStore {
	private cacheStore: WeakMap<Environment, CacheByEntryPoint> = new WeakMap()

	public get<Entry extends Parser.EntryPoint>(
		environment: Environment,
		entry: Entry,
		expression: string,
	): Parser.ParserResult[Entry] | undefined {
		let caches = this.cacheStore.get(environment)

		if (caches === undefined) {
			this.cacheStore.set(environment, (caches = this.createEntryPointCache()))
		}
		return caches[entry].get(expression) as Parser.ParserResult[Entry] | undefined
	}

	public set<Entry extends Parser.EntryPoint>(
		environment: Environment,
		entry: Entry,
		expression: string,
		value: Parser.ParserResult[Entry],
	) {
		let caches = this.cacheStore.get(environment)

		if (caches === undefined) {
			this.cacheStore.set(environment, (caches = this.createEntryPointCache()))
		}
		(caches[entry] as LRUCache<string, Parser.ParserResult[Entry]>).set(expression, value)
	}

	private createEntryPointCache(): CacheByEntryPoint {
		// TODO configurable limits
		return {
			qualifiedEntityList: new LRUCache(50),
			qualifiedFieldList: new LRUCache(50),
			qualifiedSingleEntity: new LRUCache(50),
			unconstrainedQualifiedEntityList: new LRUCache(10),
			unconstrainedQualifiedSingleEntity: new LRUCache(10),
			relativeSingleField: new LRUCache(1000),
			relativeSingleEntity: new LRUCache(500),
			relativeEntityList: new LRUCache(500),
			uniqueWhere: new LRUCache(100),
			filter: new LRUCache(100),
			orderBy: new LRUCache(50),
			taggedMap: new LRUCache(50),
		}
	}
}
