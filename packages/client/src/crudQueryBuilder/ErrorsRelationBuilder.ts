import { ObjectBuilder } from '../graphQlBuilder'

export class ErrorsRelationBuilder {
	public static errorsRelation(objectBuilder: ObjectBuilder): ObjectBuilder {
		return objectBuilder.object('errors', builder =>
			builder
				.field('type')
				.field('message')
				.object('path', builder =>
					builder
						.field('__typename')
						.fragment('_FieldPathFragment', builder => builder.field('field'))
						.fragment('_IndexPathFragment', builder => builder.field('index').field('alias')),
				),
		)
	}
}
