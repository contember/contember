import { DependencyBuilder, EventsDependencies } from './DependencyBuilder'
import { Stage } from '../dtos'
import { ContentEvent } from '@contember/engine-common'
import { DatabaseContext } from '../database'
import { SchemaVersionBuilder } from '../migrations'
import { EntitiesRelationsInput, EntitiesResult, EntitiesSelector } from '../dependencies'
import { Acl, Input, Schema } from '@contember/schema'
import { formatSchemaName } from '../helpers'
import { filterSchemaByStage, getEntity } from '@contember/schema-utils'
import { Identity } from '../authorization'
import { ImmutableSet } from '../../utils/set'
import { StagingDisabledError } from '../../StagingDisabledError'

export type EventsPermissionsVerifierContext = {
	variables: Acl.VariablesMap
	identity: Identity
}

export class DiffBuilder {
	constructor(
		private readonly dependencyBuilder: DependencyBuilder,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly entitiesSelector: EntitiesSelector,
	) {}

	public async build(
		db: DatabaseContext,
		permissionContext: EventsPermissionsVerifierContext,
		baseStage: Stage,
		headStage: Stage,
		filter: ReadonlyArray<EventFilter> | null,
	): Promise<DiffBuilderResponse> {
		throw new StagingDisabledError()
	}

	private async filterEvents(
		events: ContentEvent[],
		eventDependencies: EventsDependencies,
		permissionContext: EventsPermissionsVerifierContext,
		db: DatabaseContext,
		schema: Schema,
		baseStage: Stage,
		headStage: Stage,
		filter: ReadonlyArray<EventFilter>,
	): Promise<ContentEvent[]> {
		if (filter.length === 0) {
			return []
		}
		const baseEntities = await this.fetchAffectedEntities(db, permissionContext, schema, baseStage, filter)
		const headEntities = await this.fetchAffectedEntities(db, permissionContext, schema, headStage, filter)
		const allIds = [...baseEntities, ...headEntities]

		const rootEvents: ContentEvent[] = events.filter(it => it.rowId.some(id => allIds.includes(id)))
		const eventIds = new Set<string>([])

		const collectDependencies = (ids: ImmutableSet<string>) => {
			ids.forEach(id => {
				if (eventIds.has(id)) {
					return
				}
				eventIds.add(id)
				const deps = eventDependencies.get(id)
				if (deps) {
					collectDependencies(deps)
				}
			})
		}
		const rootEventIds = new Set(rootEvents.map(it => it.id))
		collectDependencies(rootEventIds)

		return events.filter(it => eventIds.has(it.id))
	}

	private async fetchAffectedEntities(
		db: DatabaseContext,
		permissionContext: EventsPermissionsVerifierContext,
		schema: Schema,
		stage: Stage,
		filter: readonly EventFilter[],
	): Promise<string[]> {
		const affectedEntities = (
			await Promise.all(
				filter.map(
					async it =>
						await this.entitiesSelector.getEntities(
							{
								db: db.client.forSchema(formatSchemaName(stage)),
								schema: filterSchemaByStage(schema, stage.slug),
								identityVariables: permissionContext.variables,
								roles: permissionContext.identity.roles,
							},
							{
								entity: it.entity,
								relations: it.relations,
								filter: it.id
									? {
											[getEntity(schema.model, it.entity).primary]: { eq: it.id },
									  }
									: it.filter || {},
							},
						),
				),
			)
		).flatMap(it => it)
		const collectIds = (result: EntitiesResult): string[] => {
			const { id, ...rest } = result
			return [
				id,
				...Object.values(rest).flatMap(it => {
					if (!it) {
						return []
					}
					if (Array.isArray(it)) {
						return it.flatMap(collectIds)
					}
					return collectIds(it)
				}),
			]
		}
		return affectedEntities.flatMap(it => (it ? collectIds(it) : [])).filter(it => it !== null)
	}
}

export type DiffBuilderResponse = DiffBuilderOkResponse | DiffBuilderErrorResponse

export enum DiffBuilderErrorCode {
	notRebased = 'notRebased',
	invalidFilter = 'invalidFilter',
}

export class DiffBuilderErrorResponse {
	public readonly ok: false = false

	constructor(public readonly error: DiffBuilderErrorCode, public readonly message: string) {}
}

export type EventWithDependencies = ContentEvent & { dependencies: ImmutableSet<string> }

export class DiffBuilderOkResponse {
	public readonly ok: true = true

	constructor(public readonly events: EventWithDependencies[]) {}
}

export type EventFilter = {
	entity: string
	id?: string
	filter?: Input.Where
	relations: EntitiesRelationsInput
}
