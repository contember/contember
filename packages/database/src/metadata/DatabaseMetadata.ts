import { UniqueConstraintMetadata, UniqueConstraintMetadataSet } from './UniqueConstraintMetadata'
import { ForeignKeyConstraintMetadata, ForeignKeyConstraintMetadataSet } from './ForeignKeyConstraintMetadata'
import { IndexMetadata, IndexMetadataSet } from './IndexMetadata'

export interface DatabaseMetadata {
	uniqueConstraints: UniqueConstraintMetadataSet
	foreignKeys: ForeignKeyConstraintMetadataSet
	indexes: IndexMetadataSet
}

export const createDatabaseMetadata = (args: {
	uniqueConstraints: UniqueConstraintMetadata[]
	foreignKeys: ForeignKeyConstraintMetadata[]
	indexes: IndexMetadata[]
}): DatabaseMetadata => ({
	foreignKeys: new ForeignKeyConstraintMetadataSet(args.foreignKeys),
	uniqueConstraints: new UniqueConstraintMetadataSet(args.uniqueConstraints),
	indexes: new IndexMetadataSet(args.indexes),
})

export const emptyDatabaseMetadata = createDatabaseMetadata({
	uniqueConstraints: [],
	foreignKeys: [],
	indexes: [],
})
