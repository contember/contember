import OneHasOneBuilder from '../OneHasOneBuilder'
import FieldProcessor from './FieldProcessor'
import { Model } from 'cms-common'
import NamingConventions from '../NamingConventions'

export default class OneHasOneProcessor implements FieldProcessor<OneHasOneBuilder.Options> {
	private conventions: NamingConventions

	constructor(conventions: NamingConventions) {
		this.conventions = conventions
	}

	public process(
		entityName: string,
		fieldName: string,
		options: OneHasOneBuilder.Options,
		registerField: FieldProcessor.FieldRegistrar
	): void {
		registerField(entityName, this.createOneHasOneOwner(options, fieldName))
		if (options.inversedBy) {
			registerField(
				options.target,
				this.createOneHasOneInversed(
					options as OneHasOneBuilder.Options & { inversedBy: string },
					entityName,
					fieldName
				)
			)
		}
	}

	private createOneHasOneInversed(
		options: OneHasOneBuilder.Options & { inversedBy: string },
		entityName: string,
		fieldName: string
	): Model.OneHasOneInversedRelation {
		return {
			name: options.inversedBy,
			ownedBy: fieldName,
			target: entityName,
			type: Model.RelationType.OneHasOne,
			nullable: options.inversedNullable === undefined ? true : options.inversedNullable
		}
	}

	private createOneHasOneOwner(options: OneHasOneBuilder.Options, fieldName: string): Model.OneHasOneOwnerRelation {
		const joiningColumn: Partial<Model.JoiningColumn> = options.joiningColumn || {}

		return {
			name: fieldName,
			inversedBy: options.inversedBy,
			nullable: options.nullable === undefined ? true : options.nullable,
			type: Model.RelationType.OneHasOne,
			target: options.target,
			joiningColumn: {
				columnName: joiningColumn.columnName || this.conventions.getJoiningColumnName(fieldName),
				onDelete: joiningColumn.onDelete || Model.OnDelete.restrict
			}
		}
	}
}
