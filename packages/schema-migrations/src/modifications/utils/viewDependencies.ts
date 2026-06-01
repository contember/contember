import { Model } from '@contember/schema'
import { Migration } from '../../Migration'
import { removeEntityModification } from '../entities'

type EntityDependantViews = Map<string, Set<Model.Entity>>

/**
 * Heuristically detects whether a view SQL references a given table.
 *
 * Postgres forbids altering the type of a column that is used by a view. When a view does not declare
 * its `dependencies` explicitly, we fall back to a textual scan of the view SQL for the referenced table
 * name (e.g. `FROM something`, `JOIN "something"`). This is intentionally conservative - if there is any
 * ambiguity we prefer to drop and recreate the view, which is always safe (only ordering matters).
 *
 * Identifiers are matched as standalone tokens, so a table named `item` won't match `item_view`. Both the
 * physical table name and the entity name are checked, since the SQL may reference either.
 */
const viewSqlReferencesTable = (sql: string, ...candidates: string[]): boolean => {
	// strip quotes so `"something"` and `something` are treated the same; identifiers are matched on word boundaries
	const normalized = sql.replace(/"/g, ' ')
	for (const candidate of candidates) {
		if (!candidate) {
			continue
		}
		const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		// (^|non-identifier-char) candidate (non-identifier-char|$); identifier chars are [A-Za-z0-9_]
		const pattern = new RegExp(`(^|[^A-Za-z0-9_])${escaped}([^A-Za-z0-9_]|$)`)
		if (pattern.test(normalized)) {
			return true
		}
	}
	return false
}

export const getEntityDependantViews = (model: Model.Schema): EntityDependantViews => {
	const dependants: EntityDependantViews = new Map(Object.values(model.entities).map(it => [it.name, new Set()]))
	for (const entity of Object.values(model.entities)) {
		if (!entity.view) {
			continue
		}
		if (entity.view.dependencies?.length) {
			// explicit dependencies are authoritative when provided
			for (const dependency of entity.view.dependencies) {
				const entityDependants = dependants.get(dependency)
				if (!entityDependants) {
					throw new Error()
				}
				entityDependants.add(entity)
			}
			continue
		}

		// no explicit dependencies: fall back to a textual scan of the view SQL for referenced tables,
		// so that altering a column used by such a view still drops & recreates the view (see issue #828)
		for (const referenced of Object.values(model.entities)) {
			if (referenced.name === entity.name) {
				continue
			}
			if (viewSqlReferencesTable(entity.view.sql, referenced.tableName, referenced.name)) {
				dependants.get(referenced.name)!.add(entity)
			}
		}
	}
	return dependants
}

export const cascadeRemoveDependantViews = (model: Model.Schema, entities: Model.Entity[]): Migration.Modification[] => {
	const visited = new Set<string>()
	const dependants = getEntityDependantViews(model)
	const modifications: Migration.Modification[] = []
	const removeCascade = (entity: Model.Entity) => {
		if (visited.has(entity.name)) {
			return
		}
		visited.add(entity.name)
		for (const dependant of dependants.get(entity.name) ?? []) {
			removeCascade(dependant)
		}
		if (entity.view) {
			modifications.push(removeEntityModification.createModification({ entityName: entity.name }))
		}
	}
	for (const entity of entities) {
		removeCascade(entity)
	}
	return modifications
}
