import { Model } from '@contember/schema'

// The access methods PostgreSQL ships with. The method is written into CREATE INDEX ... USING verbatim.
export const INDEX_METHODS: readonly Model.IndexMethod[] = ['btree', 'hash', 'gist', 'spgist', 'gin', 'brin']

export const isValidIndexMethod = (method: string): boolean => INDEX_METHODS.some(it => it === method)

/**
 * An index operator class is an identifier, optionally schema-qualified (e.g. "public.gin_trgm_ops").
 * It is written into CREATE INDEX verbatim, so this check is what keeps SQL out of it.
 */
export const isValidIndexOpClass = (opClass: string): boolean => /^[_a-zA-Z][_a-zA-Z0-9$]*(\.[_a-zA-Z][_a-zA-Z0-9$]*)?$/.test(opClass)
