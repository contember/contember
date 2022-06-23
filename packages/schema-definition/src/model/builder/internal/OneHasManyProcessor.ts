import FieldProcessor from './FieldProcessor.js'
import OneHasManyBuilder from '../OneHasManyBuilder.js'
import { Model } from '@contember/schema'
import { NamingConventions } from '../../definition/NamingConventions.js'

export default class OneHasManyProcessor implements FieldProcessor<OneHasManyBuilder.Options> {
	private conventions: NamingConventions

	constructor(conventions: NamingConventions) {
		this.conventions = conventions
	}

	process(
		entityName: string,
		fieldName: string,
		options: OneHasManyBuilder.Options,
		registerField: FieldProcessor.FieldRegistrar,
	): void {
		const optionsFinalized = {
			...options,
			ownedBy: options.ownedBy || entityName,
		}
		registerField(optionsFinalized.target, this.createOwning(optionsFinalized, entityName, fieldName))
		registerField(entityName, this.createInverse(optionsFinalized, fieldName))
	}

	private createInverse(
		options: OneHasManyBuilder.Options & { ownedBy: string },
		fieldName: string,
	): Model.OneHasManyRelation {
		return {
			name: fieldName,
			ownedBy: options.ownedBy,
			type: Model.RelationType.OneHasMany,
			target: options.target,
			...(options.orderBy ? { orderBy: options.orderBy } : {}),
		}
	}

	private createOwning(
		options: OneHasManyBuilder.Options & { ownedBy: string },
		entityName: string,
		fieldName: string,
	): Model.ManyHasOneRelation {
		const joiningColumn = options.ownerJoiningColumn || {}

		return {
			name: options.ownedBy,
			target: entityName,
			inversedBy: fieldName,
			nullable: options.ownerNullable !== undefined ? options.ownerNullable : true,
			type: Model.RelationType.ManyHasOne,
			joiningColumn: {
				columnName: joiningColumn.columnName || this.conventions.getJoiningColumnName(options.ownedBy),
				onDelete: joiningColumn.onDelete || Model.OnDelete.restrict,
			},
		}
	}
}
