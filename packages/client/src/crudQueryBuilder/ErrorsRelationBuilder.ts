import type { ObjectBuilder } from '../graphQlBuilder'

export class ErrorsRelationBuilder {
	public static errorsRelation(objectBuilder: ObjectBuilder): ObjectBuilder {
		return objectBuilder.object('errors', builder =>
			builder
				.field('type')
				.field('message')
				.object('path', builder =>
					builder
						.inlineFragment('_FieldPathFragment', builder => builder.field('field'))
						.inlineFragment('_IndexPathFragment', builder => builder.field('index').field('alias')),
				),
		)
	}
}
