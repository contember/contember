import FieldBuilder from './FieldBuilder.js'
import { Model } from '@contember/schema'

type PartialColumnOptions<K extends keyof ColumnBuilder.Options> =
	& Partial<ColumnBuilder.Options>
	& Pick<ColumnBuilder.Options, K>

class ColumnBuilder<O extends PartialColumnOptions<never> = PartialColumnOptions<never>> implements FieldBuilder<O> {
	constructor(private readonly options: O) {}

	public columnName(columnName: string): ColumnBuilder<O> {
		return new ColumnBuilder<O>({ ...(this.options as object), columnName } as O)
	}

	public type(
		type: Model.ColumnType,
		typeOptions: ColumnBuilder.TypeOptions = {},
	): ColumnBuilder<O & PartialColumnOptions<'type'>> {
		return new ColumnBuilder<O & PartialColumnOptions<'type'>>({
			...(this.options as object),
			type: type,
			...typeOptions,
		} as O & PartialColumnOptions<'type'>)
	}

	public nullable(): ColumnBuilder<O> {
		return new ColumnBuilder<O>({ ...(this.options as object), nullable: true } as O)
	}

	public notNull(): ColumnBuilder<O> {
		return new ColumnBuilder<O>({ ...(this.options as object), nullable: false } as O)
	}

	public unique(): ColumnBuilder<O> {
		return new ColumnBuilder<O>({ ...(this.options as object), unique: true } as O)
	}

	public primary(): ColumnBuilder<O> {
		return new ColumnBuilder<O>({ ...(this.options as object), primary: true } as O)
	}

	public typeAlias(typeAlias: string): ColumnBuilder<O> {
		return new ColumnBuilder<O>({ ...(this.options as object), typeAlias } as O)
	}

	getOption(): O {
		return this.options
	}
}

namespace ColumnBuilder {
	export type TypeOptions = {
		enumName?: string
	}

	export type Options = {
		type: Model.ColumnType
		enumName?: string
		columnName?: string
		unique?: boolean
		nullable?: boolean
		primary?: boolean
		typeAlias?: string
	}
}

export default ColumnBuilder
