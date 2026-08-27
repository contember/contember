import {
	EntityAccessor,
	EntityFieldMarkers,
	EntityId,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
	PRIMARY_KEY_NAME,
	TreeStore,
} from '@contember/binding-legacy'
import { MutationGenerator, SubMutationOperation } from '@contember/binding-legacy'
import { ContentQueryBuilder } from '@contember/client'
import { GraphQlClient } from '@contember/graphql-client'
import { WireConnection, wireConnection, WireEntity, WireValue } from './wireData'

export type EntityFixture = { [fieldName: string]: FixtureValue }
export type FixtureValue = string | number | boolean | null | EntityId | EntityFixture | EntityFixture[]

/** Read fixtures, keyed by sub-tree alias. Fields are addressed by their name, not by a placeholder. */
export type SubTreeFixtures = { [alias: string]: EntityFixture | EntityFixture[] | null }

export interface RecordedRequest {
	type: 'query' | 'mutation'
	query: string
	variables: Record<string, unknown>
}

export interface MutationFailure {
	errorMessage: string
	errors?: unknown[]
}

/**
 * An ideal content API for the data binding to talk to. It accepts every mutation, echoes back what the binding
 * has in its tree and hands out a fresh id to everything the binding has just created — which is the part that
 * matters, because that id swap is what the binding has to survive.
 *
 * It deliberately does not interpret the mutation input, so it cannot tell you that a mutation was wrong. Assert
 * on {@link FakeContentApi.requests} for that.
 */
export class FakeContentApi {
	public readonly requests: RecordedRequest[] = []

	/** Ids handed out to entities that had none, keyed by the dummy id they used to carry. */
	public readonly assignedIds = new Map<EntityId, EntityId>()

	private data: SubTreeFixtures = {}
	private nextFailure: MutationFailure | undefined = undefined
	private idCounter = 0

	public constructor(
		private readonly context: {
			markerTree: MarkerTreeRoot
			treeStore: TreeStore
			queryBuilder: ContentQueryBuilder
		},
	) {
	}

	public setData(data: SubTreeFixtures): void {
		this.data = data
	}

	/** Make the next persist come back as a failed transaction. */
	public failNextMutation(failure: MutationFailure): void {
		this.nextFailure = failure
	}

	public createClient(): GraphQlClient {
		return new GraphQlClient({
			url: 'http://localhost/content',
			fetcher: async (_url, options) => {
				const body = JSON.parse(String(options?.body)) as { query: string; variables: Record<string, unknown> }
				const type = body.query.startsWith('mutation') ? 'mutation' : 'query'
				this.requests.push({ type, query: body.query, variables: body.variables })

				const data = type === 'mutation' ? { mut: this.respondToMutation() } : this.respondToQuery()

				return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } })
			},
		})
	}

	private respondToQuery(): Record<string, WireEntity | WireEntity[] | null> {
		const response: Record<string, WireEntity | WireEntity[] | null> = {}

		for (const [placeholder, marker] of this.context.markerTree.subTrees) {
			if (marker.parameters.isCreating) {
				continue
			}
			const fixture = this.data[this.aliasOf(placeholder)] ?? null

			if (marker instanceof EntityListSubTreeMarker) {
				const rows = Array.isArray(fixture) ? fixture : (fixture === null ? [] : [fixture])
				response[placeholder] = rows.map(row => this.fromFixture(marker.fields.markers, row, marker.entityName))
			} else if (marker instanceof EntitySubTreeMarker) {
				if (Array.isArray(fixture)) {
					throw new Error(`The '${this.aliasOf(placeholder)}' sub-tree is a single entity, but its fixture is a list.`)
				}
				response[placeholder] = fixture === null ? null : this.fromFixture(marker.fields.markers, fixture, marker.entityName)
			}
		}

		return response
	}

	private respondToMutation() {
		const { operations } = MutationGenerator.getPersistMutation(this.context.treeStore, this.context.queryBuilder)
		const failure = this.nextFailure
		this.nextFailure = undefined
		const results: Record<string, unknown> = {}

		for (const operation of operations) {
			results[operation.alias] = failure === undefined
				? {
					ok: true,
					errorMessage: null,
					errors: [],
					validation: null,
					node: this.nodeForOperation(operation),
				}
				: {
					ok: false,
					errorMessage: failure.errorMessage,
					errors: failure.errors ?? [],
					validation: null,
					node: null,
				}
		}

		return {
			ok: failure === undefined,
			errorMessage: failure?.errorMessage ?? null,
			errors: failure?.errors ?? [],
			validation: null,
			...results,
		}
	}

	private nodeForOperation(operation: SubMutationOperation): WireEntity | null {
		const subTree = this.getSubTreeState(operation.subTreePlaceholder)

		if (operation.type === 'delete') {
			const entityName = subTree.type === 'entityList' ? subTree.entityName : subTree.entity.entityName
			return { [PRIMARY_KEY_NAME]: operation.id, __typename: entityName }
		}
		if (subTree.type === 'entityRealm') {
			return this.fromAccessor(subTree.getAccessor(), operation.markers)
		}
		return this.fromAccessor(subTree.getAccessor().getChildEntityById(operation.id), operation.markers)
	}

	private getSubTreeState(placeholder: string) {
		for (const subTreeStates of this.context.treeStore.subTreeStatesByRoot.values()) {
			const state = subTreeStates.get(placeholder)
			if (state !== undefined) {
				return state
			}
		}
		throw new Error(`The mutation targets an unknown sub-tree '${placeholder}'.`)
	}

	/** Builds what the server would return for an entity it has just written, straight off the binding's own tree. */
	private fromAccessor(entity: EntityAccessor, markers: EntityFieldMarkers): WireEntity {
		const result: WireEntity = {
			[PRIMARY_KEY_NAME]: this.idOf(entity),
			__typename: entity.name,
		}

		for (const [placeholder, marker] of markers) {
			if (marker instanceof FieldMarker) {
				if (marker.fieldName === PRIMARY_KEY_NAME) {
					continue
				}
				result[placeholder] = entity.getField({ hasOneRelationPath: [], field: marker.fieldName }).value as WireValue
			} else if (marker instanceof HasOneRelationMarker) {
				const child = entity.getEntity({ hasOneRelationPath: [marker.parameters] })
				result[placeholder] = child.existsOnServer || child.hasUnpersistedChanges
					? this.fromAccessor(child, marker.fields.markers)
					: null
			} else if (marker instanceof HasManyRelationMarker) {
				const children = entity.getEntityList({ hasOneRelationPath: [], hasManyRelation: marker.parameters })
				result[placeholder] = wireConnection(Array.from(children).map(child => this.fromAccessor(child, marker.fields.markers)))
			}
		}

		return result
	}

	private fromFixture(markers: EntityFieldMarkers, fixture: EntityFixture, entityName: string): WireEntity {
		const id = fixture[PRIMARY_KEY_NAME]
		if (typeof id !== 'string' && typeof id !== 'number') {
			throw new Error(`Every ${entityName} fixture needs an id.`)
		}
		const result: WireEntity = { [PRIMARY_KEY_NAME]: id, __typename: entityName }

		for (const [placeholder, marker] of markers) {
			if (marker instanceof FieldMarker) {
				if (marker.fieldName === PRIMARY_KEY_NAME) {
					continue
				}
				result[placeholder] = (fixture[marker.fieldName] ?? null) as WireValue
			} else if (marker instanceof HasOneRelationMarker) {
				const child = fixture[marker.parameters.field]
				result[placeholder] = child == null
					? null
					: this.fromFixture(marker.fields.markers, child as EntityFixture, this.entityNameOfRelation(marker))
			} else if (marker instanceof HasManyRelationMarker) {
				const children = (fixture[marker.parameters.field] ?? []) as EntityFixture[]
				result[placeholder] = wireConnection(
					children.map(child => this.fromFixture(marker.fields.markers, child, this.entityNameOfRelation(marker))),
				) satisfies WireConnection
			}
		}

		return result
	}

	private entityNameOfRelation(marker: HasOneRelationMarker | HasManyRelationMarker): string {
		return marker.environment.getSubTreeNode().entity.name
	}

	private idOf(entity: EntityAccessor): EntityId {
		if (entity.idOnServer !== undefined) {
			return entity.idOnServer
		}
		const alreadyAssigned = this.assignedIds.get(entity.id)
		if (alreadyAssigned !== undefined) {
			return alreadyAssigned
		}
		const assigned = `00000000-0000-4000-8000-${String(++this.idCounter).padStart(12, '0')}`
		this.assignedIds.set(entity.id, assigned)
		return assigned
	}

	private aliasOf(placeholder: string): string {
		for (const [alias, aliasedPlaceholder] of this.context.markerTree.placeholdersByAliases) {
			if (aliasedPlaceholder === placeholder) {
				return alias
			}
		}
		return placeholder
	}
}
