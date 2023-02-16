import FieldBuilder from './FieldBuilder'
import ColumnBuilder from './ColumnBuilder'
import OneHasOneBuilder from './OneHasOneBuilder'
import ManyHasManyBuilder from './ManyHasManyBuilder'
import OneHasManyBuilder from './OneHasManyBuilder'
import ManyHasOneBuilder from './ManyHasOneBuilder'
import { Model } from '@contember/schema'
import { AddEntityCallback } from './types'

class EntityBuilder {
	constructor(
		private readonly options: Partial<EntityBuilder.EntityOptions>,
		private readonly fields: FieldBuilder.Map = {},
		private readonly addEntity: AddEntityCallback,
	) {}

	tableName(tableName: string): EntityBuilder {
		return new EntityBuilder({ ...this.options, tableName }, this.fields, this.addEntity)
	}

	unique(fields: string[]): EntityBuilder {
		return new EntityBuilder(
			{ ...this.options, unique: [...(this.options.unique || []), { fields: fields }] },
			this.fields,
			this.addEntity,
		)
	}

	column(
		name: string,
		configurator?: EntityBuilder.FieldConfigurator<ColumnBuilder, ColumnBuilder.Options>,
	): EntityBuilder {
		const options: ColumnBuilder.Options = configurator
			? configurator(new ColumnBuilder({})).getOption()
			: { type: Model.ColumnType.String }

		const fields: FieldBuilder.Map = { ...this.fields, [name]: { type: FieldBuilder.Type.Column, options: options } }

		return new EntityBuilder(this.options, fields, this.addEntity)
	}

	oneHasOne(
		name: string,
		configurator: EntityBuilder.FieldConfigurator<OneHasOneBuilder, OneHasOneBuilder.Options>,
	): EntityBuilder {
		const options = configurator(new OneHasOneBuilder({}, this.addEntity)).getOption()

		return new EntityBuilder(
			this.options,
			{ ...this.fields, [name]: { type: FieldBuilder.Type.OneHasOne, options } },
			this.addEntity,
		)
	}

	manyHasMany(
		name: string,
		configurator: EntityBuilder.FieldConfigurator<ManyHasManyBuilder, ManyHasManyBuilder.Options>,
	): EntityBuilder {
		const options = configurator(new ManyHasManyBuilder({}, this.addEntity)).getOption()
		const fields: FieldBuilder.Map = { ...this.fields, [name]: { type: FieldBuilder.Type.ManyHasMany, options } }

		return new EntityBuilder(this.options, fields, this.addEntity)
	}

	oneHasMany(
		name: string,
		configurator: EntityBuilder.FieldConfigurator<OneHasManyBuilder, OneHasManyBuilder.Options>,
	): EntityBuilder {
		const options = configurator(new OneHasManyBuilder({}, this.addEntity)).getOption()
		const fields: FieldBuilder.Map = { ...this.fields, [name]: { type: FieldBuilder.Type.OneHasMany, options } }

		return new EntityBuilder(this.options, fields, this.addEntity)
	}

	manyHasOne(
		name: string,
		configurator: EntityBuilder.FieldConfigurator<ManyHasOneBuilder, ManyHasOneBuilder.Options>,
	): EntityBuilder {
		const options = configurator(new ManyHasOneBuilder({}, this.addEntity)).getOption()
		const fields: FieldBuilder.Map = { ...this.fields, [name]: { type: FieldBuilder.Type.ManyHasOne, options } }

		return new EntityBuilder(this.options, fields, this.addEntity)
	}

	getOptions(): EntityBuilder.EntityOptions {
		return this.options
	}

	getFields(): FieldBuilder.Map {
		return this.fields
	}

	orderBy(field: string | string[], direction: Model.OrderDirection = Model.OrderDirection.asc): EntityBuilder {
		const path = typeof field === 'string' ? [field] : field

		return new EntityBuilder(
			{ ...this.options, orderBy: [...(this.options.orderBy ?? []), { path, direction }] },
			this.fields,
			this.addEntity,
		)
	}
}

namespace EntityBuilder {
	export type FieldConfigurator<B, O> = (builder: B) => FieldBuilder<O>

	export type UniqueOptions = {
		fields: string[]
		name?: string
	}

	export type EntityOptions = {
		primary?: string
		tableName?: string
		orderBy?: Model.OrderBy[]
		unique?: UniqueOptions[]
	}
}

export default EntityBuilder
