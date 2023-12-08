import { SchemaDefinition as def, createSchema } from '@contember/schema-definition'

namespace ManyScalarsSchema {
	export class Foo {
		stringCol = def.stringColumn()
		intCol = def.intColumn()
		doubleCol = def.doubleColumn()
		dateCol = def.dateColumn()
		datetimeCol = def.dateTimeColumn()
		booleanCol = def.boolColumn()
		jsonCol = def.jsonColumn()
		uuidCol = def.uuidColumn()
	}
}


namespace EnumSchema {
	export class Foo {
		enumCol = def.enumColumn(def.createEnum('foo', 'bar'))
	}
}

namespace OneHasOneSchema {
	export class Foo {
		oneHasOneInverseRel = def.oneHasOneInverse(Bar, 'oneHasOne')
	}

	export class Bar {
		oneHasOneOwningRel = def.oneHasOne(Foo, 'oneHasOneInverseRel')
	}
}

namespace OneHasManySchema {
	export class Foo {
		oneHasManyRel = def.oneHasMany(Bar, 'manyHasOneRel')
	}

	export class Bar {
		manyHasOneRel = def.manyHasOne(Foo, 'oneHasManyRel')
	}
}


namespace ManyHasManySchema {
	export class Foo {
		manyHasManyRel = def.manyHasMany(Bar, 'manyHasManyInverseRel')
	}

	export class Bar {
		manyHasManyInverseRel = def.manyHasManyInverse(Foo, 'manyHasManyRel')
	}
}

namespace ReducedHasManySchema {
	export class Foo {
		locales = def.oneHasMany(FooLocale, 'foo')
	}

	@def.Unique('locale', 'foo')
	export class FooLocale {
		locale = def.stringColumn().notNull()
		foo = def.manyHasOne(Foo, 'locales')
	}
}

export const schemas = {
	scalarsSchema: createSchema(ManyScalarsSchema),
	enumSchema: createSchema(EnumSchema),
	oneHasOneSchema: createSchema(OneHasOneSchema),
	oneHasManySchema: createSchema(OneHasManySchema),
	manyHasManySchema: createSchema(ManyHasManySchema),
	reducedHasManySchema: createSchema(ReducedHasManySchema),
}
