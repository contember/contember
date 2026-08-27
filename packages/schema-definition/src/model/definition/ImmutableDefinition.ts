import { extendEntity } from './extensions.js'

/**
 * Marks an entity as immutable: the Content API generates no create/update/delete
 * mutations for it, regardless of ACL. Rows are written only by the engine (e.g. an
 * audit-log target). Reads follow regular ACL. Mirrors how a `@View` entity is
 * non-mutable, but backed by a real table.
 */
export const Immutable = () =>
	extendEntity(({ entity }) => ({
		...entity,
		immutable: true,
	}))
