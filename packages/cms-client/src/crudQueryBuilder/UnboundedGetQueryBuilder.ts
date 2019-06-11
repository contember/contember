import { Input } from 'cms-common'
import { Literal, ObjectBuilder } from '../graphQlBuilder'
import { BoundedGetQueryBuilder } from './BoundedGetQueryBuilder'

export class UnboundedGetQueryBuilder extends BoundedGetQueryBuilder {
	constructor(objectBuilder: ObjectBuilder = new ObjectBuilder()) {
		super(objectBuilder)
	}

	filter(where: Input.Where<Input.Condition<Input.ColumnValue<Literal>>>) {
		return new UnboundedGetQueryBuilder(this.objectBuilder.argument('filter', where))
	}

	column(name: string): UnboundedGetQueryBuilder {
		return new UnboundedGetQueryBuilder(this.objectBuilder.field(name))
	}

	by(by: Input.UniqueWhere<Literal>) {
		return new BoundedGetQueryBuilder(this.objectBuilder.argument('by', by))
	}
}
