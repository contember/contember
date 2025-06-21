import { Model } from '@contember/schema'
import FieldBuilder from './FieldBuilder'
import { AddEntityCallback, EntityConfigurator } from './types'

type PartialOptions<K extends keyof OneHasManyBuilder.Options> =
	& Partial<OneHasManyBuilder.Options>
	& Pick<OneHasManyBuilder.Options, K>

class OneHasManyBuilder<O extends PartialOptions<never> = PartialOptions<never>> implements FieldBuilder<O> {
	constructor(private readonly options: O, private readonly addEntity: AddEntityCallback) {}

	public target(target: string, configurator?: EntityConfigurator): OneHasManyBuilder<O & PartialOptions<'target'>> {
		if (configurator) {
			this.addEntity(target, configurator)
		}
		return this.withOption('target', target)
	}

	public ownedBy(ownedBy: string): OneHasManyBuilder<O> {
		return this.withOption('ownedBy', ownedBy)
	}

	public ownerJoiningColumn(columnName: string): OneHasManyBuilder<O> {
		return this.withOption('ownerJoiningColumn', { ...this.options.ownerJoiningColumn, columnName })
	}

	public onDelete(onDelete: Model.OnDelete): OneHasManyBuilder<O> {
		return this.withOption('ownerJoiningColumn', { ...this.options.ownerJoiningColumn, onDelete })
	}

	public ownerNotNull(): OneHasManyBuilder<O> {
		return this.withOption('ownerNullable', false)
	}

	public ownerNullable(): OneHasManyBuilder<O> {
		return this.withOption('ownerNullable', true)
	}

	public orderBy(field: string | string[], direction: Model.OrderDirection = Model.OrderDirection.asc): OneHasManyBuilder<O> {
		const path = typeof field === 'string' ? [field] : field
		return this.withOption('orderBy', [...(this.options.orderBy || []), { path, direction }])
	}

	public description(description: string): OneHasManyBuilder<O> {
		return this.withOption('description', description)
	}

	public deprecated(deprecationReason: string): OneHasManyBuilder<O> {
		return this.withOption('deprecationReason', deprecationReason)
	}

	public getOption(): O {
		return this.options
	}

	private withOption<K extends keyof OneHasManyBuilder.Options>(key: K, value: OneHasManyBuilder.Options[K]) {
		return new OneHasManyBuilder<O & PartialOptions<K>>(
			{ ...(this.options as object), [key]: value } as O & PartialOptions<K>,
			this.addEntity,
		)
	}
}

namespace OneHasManyBuilder {
	export type Options = {
		target: string
		ownedBy?: string
		ownerJoiningColumn?: Partial<Model.JoiningColumn>
		ownerNullable?: boolean
		orderBy?: Model.OrderBy[]
		description?: string
		deprecationReason?: string
	}
}

export default OneHasManyBuilder
