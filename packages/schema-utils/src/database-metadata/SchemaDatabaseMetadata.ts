import { UniqueConstraintMetadata, UniqueConstraintMetadataSet } from './UniqueConstraintMetadata'
import { ForeignKeyConstraintMetadata, ForeignKeyConstraintMetadataSet } from './ForeignKeyConstraintMetadata'
import { IndexMetadata, IndexMetadataSet } from './IndexMetadata'

export interface SchemaDatabaseMetadata {
	uniqueConstraints: UniqueConstraintMetadataSet
	foreignKeys: ForeignKeyConstraintMetadataSet
	indexes: IndexMetadataSet
}

export const createSchemaDatabaseMetadata = (args: {
	uniqueConstraints: UniqueConstraintMetadata[]
	foreignKeys: ForeignKeyConstraintMetadata[]
	indexes: IndexMetadata[]
}): SchemaDatabaseMetadata => ({
	foreignKeys: new ForeignKeyConstraintMetadataSet(args.foreignKeys),
	uniqueConstraints: new UniqueConstraintMetadataSet(args.uniqueConstraints),
	indexes: new IndexMetadataSet(args.indexes),
})

export const dummySchemaDatabaseMetadata = createSchemaDatabaseMetadata({
	uniqueConstraints: [],
	foreignKeys: [],
	indexes: [],
})
