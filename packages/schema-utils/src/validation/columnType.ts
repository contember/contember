/**
 * Fuzzy format check of a user-defined column type (`varchar(255)`, `numeric(10, 2)[]`, `text COLLATE "de_DE"`, an enum name).
 * The type is written into migration SQL verbatim, so this check is what keeps a `;` or a closing quote out of it.
 */
export const isValidColumnType = (columnType: string): boolean =>
	/^[\w_]+(?:\(\w+(?:,\w+)*\))?\w*(?:"[^"]+")?(\[])*$/.test(columnType.replaceAll(/\s+/g, ''))
