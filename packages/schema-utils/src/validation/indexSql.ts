import { Model } from '@contember/schema'

// The access methods PostgreSQL ships with; the record makes a new Model.IndexMethod member a type error until it is listed.
const indexMethods: Record<Model.IndexMethod, true> = { btree: true, hash: true, gist: true, spgist: true, gin: true, brin: true }

export const INDEX_METHODS: readonly string[] = Object.keys(indexMethods)

// The method is written into CREATE INDEX ... USING verbatim.
export const isValidIndexMethod = (method: string): boolean => INDEX_METHODS.includes(method)

/**
 * An index operator class is an identifier, optionally schema-qualified (e.g. "public.gin_trgm_ops").
 * It is written into CREATE INDEX verbatim, so this check is what keeps SQL out of it.
 */
export const isValidIndexOpClass = (opClass: string): boolean => /^[_a-zA-Z][_a-zA-Z0-9$]*(\.[_a-zA-Z][_a-zA-Z0-9$]*)?$/.test(opClass)
