import { Input } from 'cms-common'
import Literal from '../graphQlBuilder/Literal'
import ObjectBuilder from '../graphQlBuilder/ObjectBuilder'
import BoundedGetQueryBuilder from './BoundedGetQueryBuilder'

export default class UnboundedGetQueryBuilder extends BoundedGetQueryBuilder {
	constructor(objectBuilder: ObjectBuilder = new ObjectBuilder()) {
		super(objectBuilder)
	}

	column(name: string): UnboundedGetQueryBuilder {
		return new UnboundedGetQueryBuilder(this.objectBuilder.field(name))
	}

	where(where: Input.UniqueWhere<Literal>) {
		return new BoundedGetQueryBuilder(this.objectBuilder.argument('by', where))
	}
}
