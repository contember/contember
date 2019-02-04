import { Model } from 'cms-common'
import SchemaBuilder from '../../../src/content-schema/builder/SchemaBuilder'

export default new SchemaBuilder()
	.entity('Author', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
	.entity('Post', entity =>
		entity
			.manyHasOne('author', r => r.target('Author'))
			.column('title', c => c.type(Model.ColumnType.String))
			.column('content', c => c.type(Model.ColumnType.String))
	)
	.buildSchema()
