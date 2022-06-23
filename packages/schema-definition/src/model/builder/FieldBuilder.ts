import OneHasOneBuilder from './OneHasOneBuilder.js'
import ManyHasOneBuilder from './ManyHasOneBuilder.js'
import ManyHasManyBuilder from './ManyHasManyBuilder.js'
import OneHasManyBuilder from './OneHasManyBuilder.js'
import ColumnBuilder from './ColumnBuilder.js'

interface FieldBuilder<O> {
	getOption(): O
}

namespace FieldBuilder {
	export enum Type {
		Column = 'column',
		ManyHasMany = 'manyHasMany',
		OneHasOne = 'oneHasOne',
		OneHasMany = 'oneHasMany',
		ManyHasOne = 'manyHasOne',
	}

	export type Options =
		| { type: Type.Column; options: ColumnBuilder.Options }
		| { type: Type.OneHasOne; options: OneHasOneBuilder.Options }
		| { type: Type.ManyHasMany; options: ManyHasManyBuilder.Options }
		| { type: Type.OneHasMany; options: OneHasManyBuilder.Options }
		| { type: Type.ManyHasOne; options: ManyHasOneBuilder.Options }

	export type Map = { [name: string]: Options }
}

export default FieldBuilder
