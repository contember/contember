import OneHasOneBuilder from '../OneHasOneBuilder'
import FieldProcessor from './FieldProcessor'
import { Model } from '@contember/schema'
import { NamingConventions } from '../../definition/NamingConventions'

export default class OneHasOneProcessor implements FieldProcessor<OneHasOneBuilder.Options> {
	private conventions: NamingConventions

	constructor(conventions: NamingConventions) {
		this.conventions = conventions
	}

	public process(
		entityName: string,
		fieldName: string,
		options: OneHasOneBuilder.Options,
		registerField: FieldProcessor.FieldRegistrar,
	): void {
		registerField(entityName, this.createOneHasOneOwner(options, fieldName))
		if (options.inversedBy) {
			registerField(
				options.target,
				this.createOneHasOneInverse(
					options as OneHasOneBuilder.Options & { inversedBy: string },
					entityName,
					fieldName,
				),
			)
		}
	}

	private createOneHasOneInverse(
		options: OneHasOneBuilder.Options & { inversedBy: string },
		entityName: string,
		fieldName: string,
	): Model.OneHasOneInverseRelation {
		return {
			name: options.inversedBy,
			ownedBy: fieldName,
			target: entityName,
			type: Model.RelationType.OneHasOne,
			nullable: options.inverseNullable === undefined ? true : options.inverseNullable,
		}
	}

	private createOneHasOneOwner(options: OneHasOneBuilder.Options, fieldName: string): Model.OneHasOneOwningRelation {
		const joiningColumn: Partial<Model.JoiningColumn> = options.joiningColumn || {}

		return {
			name: fieldName,
			...(typeof options.inversedBy === 'undefined' ? {} : { inversedBy: options.inversedBy }),
			nullable: options.nullable === undefined ? true : options.nullable,
			type: Model.RelationType.OneHasOne,
			target: options.target,
			joiningColumn: {
				columnName: joiningColumn.columnName || this.conventions.getJoiningColumnName(fieldName),
				onDelete: joiningColumn.onDelete || Model.OnDelete.restrict,
			},
			...(options.orphanRemoval ? { orphanRemoval: true } : {}),
		}
	}
}
