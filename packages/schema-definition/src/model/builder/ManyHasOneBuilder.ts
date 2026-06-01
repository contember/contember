import { Model } from '@contember/schema'
import FieldBuilder from './FieldBuilder.js'
import { AddEntityCallback, EntityConfigurator } from './types.js'

type PartialOptions<K extends keyof ManyHasOneBuilder.Options> =
	& Partial<ManyHasOneBuilder.Options>
	& Pick<ManyHasOneBuilder.Options, K>

class ManyHasOneBuilder<O extends PartialOptions<never> = PartialOptions<never>> implements FieldBuilder<O> {
	constructor(private readonly options: O, private readonly addEntity: AddEntityCallback) {}

	target(target: string, configurator?: EntityConfigurator): ManyHasOneBuilder<O & PartialOptions<'target'>> {
		if (configurator) {
			this.addEntity(target, configurator)
		}
		return this.withOption('target', target)
	}

	inversedBy(inversedBy: string): ManyHasOneBuilder<O> {
		return this.withOption('inversedBy', inversedBy)
	}

	joiningColumn(columnName: string): ManyHasOneBuilder<O> {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, columnName })
	}

	onDelete(onDelete: Model.OnDelete): ManyHasOneBuilder<O> {
		return this.withOption('joiningColumn', { ...this.options.joiningColumn, onDelete })
	}

	notNull(): ManyHasOneBuilder<O> {
		return this.withOption('nullable', false)
	}

	getOption(): O {
		return this.options
	}

	private withOption<K extends keyof ManyHasOneBuilder.Options>(key: K, value: ManyHasOneBuilder.Options[K]) {
		return new ManyHasOneBuilder<O & PartialOptions<K>>(
			{ ...(this.options as object), [key]: value } as O & PartialOptions<K>,
			this.addEntity,
		)
	}
}

namespace ManyHasOneBuilder {
	export type Options = {
		target: string
		inversedBy?: string
		joiningColumn?: Partial<Model.JoiningColumn>
		nullable?: boolean
	}
}

export default ManyHasOneBuilder
