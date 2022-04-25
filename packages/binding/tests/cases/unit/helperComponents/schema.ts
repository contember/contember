import { Schema } from '../../../../src/core/schema'
import { SchemaPreprocessor } from '../../../../src/core/schema/SchemaPreprocessor'

export const schema = new Schema(SchemaPreprocessor.processRawSchema({
		entities: [
			{
				name: 'Category',
				fields: [
					{
						__typename: '_Column',
						name: 'id',
						nullable: false,
						defaultValue: null,
						type: 'Uuid',
						enumName: null,
					},
					{
						__typename: '_Column',
						name: 'title',
						nullable: false,
						defaultValue: null,
						type: 'String',
						enumName: null,
					},
					{
						__typename: '_Relation',
						name: 'articles',
						targetEntity: 'Article',
						type: 'OneHasMany',
						nullable: null,
						ownedBy: 'category',
						side: 'inverse',
						orderBy: null,
						onDelete: null,
						orphanRemoval: null,
					},
				],
				customPrimaryAllowed: false,
				unique: [],
			},
			{
				name: 'Article',
				fields: [
					{
						__typename: '_Column',
						name: 'id',
						nullable: false,
						defaultValue: null,
						type: 'Uuid',
						enumName: null,
					},
					{
						__typename: '_Column',
						name: 'title',
						nullable: false,
						defaultValue: null,
						type: 'String',
						enumName: null,
					},
					{
						__typename: '_Column',
						name: 'isPublished',
						nullable: false,
						defaultValue: null,
						type: 'Boolean',
						enumName: null,
					},
					{
						__typename: '_Relation',
						name: 'category',
						targetEntity: 'Category',
						type: 'ManyHasOne',
						nullable: null,
						inversedBy: 'articles',
						side: 'owning',
						orderBy: null,
						onDelete: null,
						orphanRemoval: null,
					},
				],
				customPrimaryAllowed: false,
				unique: [],
			},
		],
		enums: [],
	},
))
