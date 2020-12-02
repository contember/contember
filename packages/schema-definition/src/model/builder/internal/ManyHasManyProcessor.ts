import FieldProcessor from './FieldProcessor'
import ManyHasManyBuilder from '../ManyHasManyBuilder'
import { Model } from '@contember/schema'
import NamingConventions from '../../definition/NamingConventions'

export default class ManyHasManyProcessor implements FieldProcessor<ManyHasManyBuilder.Options> {
	private conventions: NamingConventions

	constructor(conventions: NamingConventions) {
		this.conventions = conventions
	}

	public process(
		entityName: string,
		fieldName: string,
		options: ManyHasManyBuilder.Options,
		registerField: FieldProcessor.FieldRegistrar,
	): void {
		registerField(entityName, this.createManyHasManyOwner(options, entityName, fieldName))
		if (options.inversedBy) {
			registerField(options.target, this.createManyHasManyInverse(options.inversedBy, entityName, fieldName))
		}
	}

	private createManyHasManyInverse(
		inversedBy: string,
		entityName: string,
		fieldName: string,
	): Model.ManyHasManyInverseRelation {
		return {
			name: inversedBy,
			ownedBy: fieldName,
			target: entityName,
			type: Model.RelationType.ManyHasMany,
		}
	}

	private createManyHasManyOwner(
		options: ManyHasManyBuilder.Options,
		entityName: string,
		fieldName: string,
	): Model.ManyHasManyOwnerRelation {
		let joiningTable: Model.JoiningTable | undefined = options.joiningTable
		if (!joiningTable) {
			const columnNames = this.conventions.getJoiningTableColumnNames(
				entityName,
				fieldName,
				options.target,
				options.inversedBy,
			)
			joiningTable = {
				tableName: this.conventions.getJoiningTableName(entityName, fieldName),
				joiningColumn: { columnName: columnNames[0], onDelete: Model.OnDelete.cascade },
				inverseJoiningColumn: { columnName: columnNames[1], onDelete: Model.OnDelete.cascade },
			}
		}

		return {
			type: Model.RelationType.ManyHasMany,
			name: fieldName,
			...(typeof options.inversedBy === 'undefined' ? {} : { inversedBy: options.inversedBy }),
			target: options.target,
			joiningTable: joiningTable,
			...(options.orderBy ? { orderBy: options.orderBy } : {}),
		}
	}
}
