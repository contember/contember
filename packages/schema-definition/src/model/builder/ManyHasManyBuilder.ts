import { Model } from '@contember/schema'
import FieldBuilder from './FieldBuilder.js'
import { AddEntityCallback, EntityConfigurator } from './types.js'

type PartialOptions<K extends keyof ManyHasManyBuilder.Options> =
	& Partial<ManyHasManyBuilder.Options>
	& Pick<ManyHasManyBuilder.Options, K>

class ManyHasManyBuilder<O extends PartialOptions<never> = PartialOptions<never>> implements FieldBuilder<O> {
	constructor(private readonly options: O, private readonly addEntity: AddEntityCallback) {}

	target(target: string, configurator?: EntityConfigurator): ManyHasManyBuilder<O & PartialOptions<'target'>> {
		if (configurator) {
			this.addEntity(target, configurator)
		}
		return this.withOption('target', target)
	}

	inversedBy(inversedBy: string): ManyHasManyBuilder<O> {
		return this.withOption('inversedBy', inversedBy)
	}

	joiningTable(joiningTable: Model.JoiningTable): ManyHasManyBuilder<O> {
		return this.withOption('joiningTable', joiningTable)
	}

	orderBy(field: string | string[], direction: Model.OrderDirection = Model.OrderDirection.asc): ManyHasManyBuilder<O> {
		const path = typeof field === 'string' ? [field] : field
		return this.withOption('orderBy', [...(this.options.orderBy || []), { path, direction }])
	}

	getOption(): O {
		return this.options
	}

	private withOption<K extends keyof ManyHasManyBuilder.Options>(key: K, value: ManyHasManyBuilder.Options[K]) {
		return new ManyHasManyBuilder<O & PartialOptions<K>>(
			{ ...(this.options as object), [key]: value } as O & PartialOptions<K>,
			this.addEntity,
		)
	}
}

namespace ManyHasManyBuilder {
	export type Options = {
		target: string
		inversedBy?: string
		joiningTable?: Model.JoiningTable
		orderBy?: Model.OrderBy[]
	}
}

export default ManyHasManyBuilder
