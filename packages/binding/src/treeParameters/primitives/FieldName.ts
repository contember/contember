/*
	This type does not contain any query language. It is an atomic field (e.g. "surname" or "images")
	that represents a single node within a tree. It can be a "leaf"-field or a relation.

	Most usages of this should have been PlaceholderName. This needs fixed.
 */
export type FieldName = string
