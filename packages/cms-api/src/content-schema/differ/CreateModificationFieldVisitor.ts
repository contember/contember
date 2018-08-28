import { Model, deepCopy } from 'cms-common'
import { Modification } from './modifications'

export default class CreateFieldVisitor
	implements Model.ColumnVisitor<Modification>, Model.RelationByTypeVisitor<Modification | null> {
	constructor(private readonly entity: Model.Entity) {}

	public visitColumn({}, updatedColumn: Model.AnyColumn): Modification {
		return {
			modification: 'createColumn',
			entityName: this.entity.name,
			field: deepCopy(updatedColumn)
		}
	}

	public visitManyHasOne(
		{},
		relation: Model.ManyHasOneRelation,
		{},
		targetRelation: Model.OneHasManyRelation | null
	): Modification {
		return {
			modification: 'createRelation',
			entityName: this.entity.name,
			owningSide: relation,
			...(targetRelation ? { inverseSide: targetRelation } : {})
		}
	}

	public visitOneHasMany() {
		return null
	}

	public visitOneHasOneOwner(
		{},
		relation: Model.OneHasOneOwnerRelation,
		{},
		targetRelation: Model.OneHasOneInversedRelation | null
	): Modification {
		return {
			modification: 'createRelation',
			entityName: this.entity.name,
			owningSide: relation,
			...(targetRelation ? { inverseSide: targetRelation } : {})
		}
	}

	public visitOneHasOneInversed() {
		return null
	}

	public visitManyHasManyOwner(
		{},
		relation: Model.ManyHasManyOwnerRelation,
		{},
		targetRelation: Model.ManyHasManyInversedRelation | null
	): Modification {
		return {
			modification: 'createRelation',
			entityName: this.entity.name,
			owningSide: relation,
			...(targetRelation ? { inverseSide: targetRelation } : {})
		}
	}

	public visitManyHasManyInversed() {
		return null
	}
}
