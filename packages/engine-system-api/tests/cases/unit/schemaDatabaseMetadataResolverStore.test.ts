import { expect, test } from 'bun:test'
import { Connection, createDatabaseMetadata, DatabaseMetadata, DatabaseMetadataResolver } from '@contember/database'
import { ConnectionMock } from '@contember/database-tester'
import crypto from 'node:crypto'
import { DatabaseContextFactory, MigrationsDatabaseMetadataResolverStoreFactory } from '../../../src/model/index.js'

class CountingResolver extends DatabaseMetadataResolver {
	public readonly resolvedSchemas: string[] = []

	override async resolveMetadata(db: Connection.Queryable, schema: string): Promise<DatabaseMetadata> {
		this.resolvedSchemas.push(schema)
		return createDatabaseMetadata({
			foreignKeys: [],
			uniqueConstraints: [],
			indexes: [{ indexName: `idx_${this.resolvedSchemas.length}`, tableName: 'article', columnNames: ['title'], unique: false }],
		})
	}
}

const createStore = () => {
	const resolver = new CountingResolver()
	const db = new DatabaseContextFactory('system', { uuid: () => crypto.randomUUID() }).create(new ConnectionMock([]))
	return { resolver, store: new MigrationsDatabaseMetadataResolverStoreFactory(resolver).create(db) }
}

const indexNames = (metadata: DatabaseMetadata) => metadata.indexes.filter({ tableName: 'article' }).getNames()

test('a callback that does not read metadata never resolves it', async () => {
	const { resolver, store } = createStore()
	expect(await store.withMetadata('stage_live', () => 'CREATE TABLE article ()')).toBe('CREATE TABLE article ()')
	store.invalidate('stage_live')
	expect(await store.withMetadata('stage_live', () => 'ALTER TABLE article ADD title text')).toBe('ALTER TABLE article ADD title text')
	expect(resolver.resolvedSchemas).toEqual([])
})

test('a callback that reads metadata gets it resolved, cached until invalidated', async () => {
	const { resolver, store } = createStore()
	expect(await store.withMetadata('stage_live', indexNames)).toEqual(['idx_1'])
	expect(await store.withMetadata('stage_live', indexNames)).toEqual(['idx_1'])
	expect(resolver.resolvedSchemas).toEqual(['stage_live'])

	store.invalidate('stage_live')
	await store.withMetadata('stage_live', () => 'no read')
	expect(resolver.resolvedSchemas).toEqual(['stage_live'])
	expect(await store.withMetadata('stage_live', indexNames)).toEqual(['idx_2'])
	expect(resolver.resolvedSchemas).toEqual(['stage_live', 'stage_live'])
})

test('metadata is cached per schema', async () => {
	const { resolver, store } = createStore()
	await store.withMetadata('stage_live', indexNames)
	await store.withMetadata('stage_preview', indexNames)
	store.invalidate('stage_preview')
	await store.withMetadata('stage_live', indexNames)
	expect(resolver.resolvedSchemas).toEqual(['stage_live', 'stage_preview'])
})

test('an error thrown by the callback itself propagates without resolving metadata', async () => {
	const { resolver, store } = createStore()
	const result = store.withMetadata('stage_live', () => {
		throw new Error('ambiguous index')
	})
	await expect(result).rejects.toThrow('ambiguous index')
	expect(resolver.resolvedSchemas).toEqual([])
})
