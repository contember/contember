import FieldProcessor from './FieldProcessor.js'
import { Model } from '@contember/schema'
import ManyHasOneBuilder from '../ManyHasOneBuilder.js'
import { NamingConventions } from '../../definition/NamingConventions.js'

export default class ManyHasOneProcessor implements FieldProcessor<ManyHasOneBuilder.Options> {
	private conventions: NamingConventions

	constructor(conventions: NamingConventions) {
		this.conventions = conventions
	}

	public process(
		entityName: string,
		fieldName: string,
		options: ManyHasOneBuilder.Options,
		registerField: FieldProcessor.FieldRegistrar,
	): void {
		registerField(entityName, this.createManyHasOneOwning(options, fieldName))
		if (options.inversedBy) {
			const inverse = this.createManyHasOneInverse(
				options as ManyHasOneBuilder.Options & { inversedBy: string },
				entityName,
				fieldName,
			)
			registerField(options.target, inverse)
		}
	}

	private createManyHasOneInverse(
		options: ManyHasOneBuilder.Options & { inversedBy: string },
		entityName: string,
		fieldName: string,
	): Model.OneHasManyRelation {
		return {
			name: options.inversedBy,
			ownedBy: fieldName,
			target: entityName,
			type: Model.RelationType.OneHasMany,
		}
	}

	private createManyHasOneOwning(options: ManyHasOneBuilder.Options, fieldName: string): Model.ManyHasOneRelation {
		const joiningColumn = options.joiningColumn || {}
		return {
			name: fieldName,
			...(typeof options.inversedBy === 'undefined' ? {} : { inversedBy: options.inversedBy }),
			nullable: options.nullable === undefined ? true : options.nullable,
			type: Model.RelationType.ManyHasOne,
			target: options.target,
			joiningColumn: {
				columnName: joiningColumn.columnName || this.conventions.getJoiningColumnName(fieldName),
				onDelete: joiningColumn.onDelete || Model.OnDelete.restrict,
			},
		}
	}
}
