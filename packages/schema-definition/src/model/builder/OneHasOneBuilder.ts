import { Model } from '@contember/schema'
import FieldBuilder from './FieldBuilder'
import { AddEntityCallback, EntityConfigurator } from './types'

type PartialOptions<K extends keyof OneHasOneBuilder.Options> =
	& Partial<OneHasOneBuilder.Options>
	& Pick<OneHasOneBuilder.Options, K>

class OneHasOneBuilder<O extends PartialOptions<never> = PartialOptions<never>> implements FieldBuilder<O> {
	constructor(private readonly options: O, private readonly addEntity: AddEntityCallback) {}

	target(target: string, configurator?: EntityConfigurator): OneHasOneBuilder<O & PartialOptions<'target'>> {
		if (configurator) {
			this.addEntity(target, configurator)
		}
		return this.withOption('target', target)
	}

	inversedBy(inversedBy: string): OneHasOneBuilder<O> {
		return this.withOption('inversedBy', inversedBy)
	}

	joiningColumn(columnName: string): OneHasOneBuilder<O> {
		return this.withOption('joiningColumn', { ...this.joiningColumn, columnName })
	}

	onDelete(onDelete: Model.OnDelete): OneHasOneBuilder<O> {
		return this.withOption('joiningColumn', { ...this.joiningColumn, onDelete })
	}

	notNull(): OneHasOneBuilder<O> {
		return this.withOption('nullable', false)
	}

	inverseNotNull(): OneHasOneBuilder<O> {
		return this.withOption('inverseNullable', false)
	}

	/** @deprecated use inverseNotNull*/
	inversedNotNull(): OneHasOneBuilder<O> {
		return this.withOption('inverseNullable', false)
	}

	removeOrphan(): OneHasOneBuilder<O> {
		return this.withOption('orphanRemoval', true)
	}

	getOption(): O {
		return this.options
	}

	private withOption<K extends keyof OneHasOneBuilder.Options>(key: K, value: OneHasOneBuilder.Options[K]) {
		return new OneHasOneBuilder<O & PartialOptions<K>>(
			{ ...(this.options as object), [key]: value } as O & PartialOptions<K>,
			this.addEntity,
		)
	}
}

namespace OneHasOneBuilder {
	export type Options = {
		target: string
		inversedBy?: string
		joiningColumn?: Partial<Model.JoiningColumn>
		nullable?: boolean
		inverseNullable?: boolean
		orphanRemoval?: true
	}
}

export default OneHasOneBuilder
