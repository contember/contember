import { NormalizedQueryResponseData, ReceivedDataTree } from '../accessorTree'
import { BindingError } from '../BindingError'
import { Environment } from '../dao'
import { MarkerTreeRoot, PlaceholderGenerator } from '../markers'
import { QueryLanguage } from '../queryLanguage'
import {
	Alias,
	SugaredQualifiedEntityList,
	SugaredQualifiedSingleEntity,
	SugaredUnconstrainedQualifiedEntityList,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { MarkerMerger } from './MarkerMerger'
import { QueryResponseNormalizer } from './QueryResponseNormalizer'
import { Schema } from './schema'
import {
	EntityListState,
	EntityRealmKey,
	EntityRealmState,
	EntityRealmStateStub,
	EntityState,
	RootStateNode,
} from './state'

export class TreeStore {
	// TODO deletes and disconnects cause memory leaks here as they don't traverse the tree to remove nested states.
	//  This could theoretically also be intentional given that both operations happen relatively infrequently,
	//  or at least rarely enough that we could potentially just ignore the problem (which we're doing now).
	//  Nevertheless, no real analysis has been done and it could turn out to be a problem.
	public readonly entityStore: Map<string, EntityState> = new Map()
	public readonly entityRealmStore: Map<EntityRealmKey, EntityRealmState | EntityRealmStateStub> = new Map()
	public readonly subTreeStates: Map<string, RootStateNode> = new Map()

	private _schema: Schema | undefined

	private _markerTree: MarkerTreeRoot = new MarkerTreeRoot(new Map(), new Map())
	private persistedData: NormalizedQueryResponseData = new NormalizedQueryResponseData(new Map(), new Map())

	public updatePersistedData(response: ReceivedDataTree) {
		QueryResponseNormalizer.mergeInResponse(this.persistedData, response)
	}

	public updateSchema(newSchema: Schema) {
		// TODO
		if (this._schema === undefined) {
			this._schema = newSchema
		}
	}

	public extendTree(newMarkerTree: MarkerTreeRoot, newPersistedData: ReceivedDataTree) {
		this._markerTree = MarkerMerger.mergeMarkerTreeRoots(this._markerTree, newMarkerTree)
		QueryResponseNormalizer.mergeInResponse(this.persistedData, newPersistedData)
	}

	public get markerTree() {
		return this._markerTree
	}

	public get persistedEntityData() {
		return this.persistedData.persistedEntityDataStore
	}

	public get subTreePersistedData() {
		return this.persistedData.subTreeDataStore
	}

	public get schema(): Schema {
		if (this._schema === undefined) {
			throw new BindingError(`Fatal error: failed to load api schema.`)
		}
		return this._schema
	}

	public getSubTreeState(
		mode: 'entity',
		aliasOrParameters: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
		environment: Environment,
	): EntityRealmState
	public getSubTreeState(
		mode: 'entityList',
		aliasOrParameters: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
		environment: Environment,
	): EntityListState
	public getSubTreeState(
		mode: 'entity' | 'entityList',
		aliasOrParameters:
			| Alias
			| SugaredQualifiedSingleEntity
			| SugaredUnconstrainedQualifiedSingleEntity
			| SugaredQualifiedEntityList
			| SugaredUnconstrainedQualifiedEntityList,
		environment: Environment,
	): RootStateNode {
		let placeholderName: string

		if (typeof aliasOrParameters === 'string') {
			const placeholderByAlias = this.markerTree.placeholdersByAliases.get(aliasOrParameters)

			if (placeholderByAlias === undefined) {
				throw new BindingError(`Undefined sub-tree alias '${aliasOrParameters}'.`)
			}
			placeholderName = placeholderByAlias
		} else if (mode === 'entityList') {
			placeholderName = PlaceholderGenerator.getEntityListSubTreePlaceholder(
				aliasOrParameters.isCreating
					? QueryLanguage.desugarUnconstrainedQualifiedEntityList(
							aliasOrParameters as SugaredUnconstrainedQualifiedEntityList,
							environment,
					  )
					: QueryLanguage.desugarQualifiedEntityList(aliasOrParameters as SugaredQualifiedEntityList, environment),
			)
		} else if (mode === 'entity') {
			placeholderName = PlaceholderGenerator.getEntitySubTreePlaceholder(
				aliasOrParameters.isCreating
					? QueryLanguage.desugarUnconstrainedQualifiedSingleEntity(
							aliasOrParameters as SugaredUnconstrainedQualifiedSingleEntity,
							environment,
					  )
					: QueryLanguage.desugarQualifiedSingleEntity(aliasOrParameters as SugaredQualifiedSingleEntity, environment),
			)
		} else {
			throw new BindingError()
		}
		const subTreeState = this.subTreeStates.get(placeholderName)

		if (subTreeState === undefined) {
			throw new BindingError(`Trying to retrieve a non-existent sub-tree '${placeholderName}'.`)
		}
		return subTreeState
	}
}
