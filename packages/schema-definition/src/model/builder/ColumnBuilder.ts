import FieldBuilder from './FieldBuilder'
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
		return new ColumnBuilder<O>({ ...this.options, nullable: true } as O)
	}

	public notNull(): ColumnBuilder<O> {
		return new ColumnBuilder<O>({ ...this.options, nullable: false } as O)
	}

	public unique(): ColumnBuilder<O> {
		return new ColumnBuilder<O>({ ...this.options, unique: true } as O)
	}

	public primary(): ColumnBuilder<O> {
		return new ColumnBuilder<O>({ ...(this.options as object), primary: true } as O)
	}

	public typeAlias(typeAlias: string): ColumnBuilder<O> {
		return new ColumnBuilder<O>({ ...this.options, typeAlias } as O)
	}

	public description(description: string): ColumnBuilder<O> {
		return new ColumnBuilder<O>({ ...this.options, description } as O)
	}

	public deprecated(deprecationReason: string): ColumnBuilder<O> {
		return new ColumnBuilder<O>({ ...this.options, deprecationReason } as O)
	}

	public getOption(): O {
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
		description?: string
		deprecationReason?: string
	}
}

export default ColumnBuilder
