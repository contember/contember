import { Environment } from '../dao'
import { LRUCache } from '../structures'
import { Parser } from './Parser'

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
		;(caches[entry] as LRUCache<string, Parser.ParserResult[Entry]>).set(expression, value)
	}

	private createEntryPointCache(): CacheByEntryPoint {
		// TODO configurable limits
		return {
			[Parser.EntryPoint.QualifiedEntityList]: new LRUCache(50),
			[Parser.EntryPoint.QualifiedFieldList]: new LRUCache(50),
			[Parser.EntryPoint.QualifiedSingleEntity]: new LRUCache(50),
			[Parser.EntryPoint.UnconstrainedQualifiedEntityList]: new LRUCache(10),
			[Parser.EntryPoint.UnconstrainedQualifiedSingleEntity]: new LRUCache(10),
			[Parser.EntryPoint.RelativeSingleField]: new LRUCache(1000),
			[Parser.EntryPoint.RelativeSingleEntity]: new LRUCache(500),
			[Parser.EntryPoint.RelativeEntityList]: new LRUCache(500),
			[Parser.EntryPoint.UniqueWhere]: new LRUCache(100),
			[Parser.EntryPoint.Filter]: new LRUCache(100),
			[Parser.EntryPoint.OrderBy]: new LRUCache(50),
		}
	}
}
