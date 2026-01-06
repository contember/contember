import { c, createSchema } from '@contember/schema-definition'

namespace ManyScalarsSchema {
	export class Foo {
		stringCol = c.stringColumn()
		intCol = c.intColumn()
		doubleCol = c.doubleColumn()
		dateCol = c.dateColumn()
		datetimeCol = c.dateTimeColumn()
		booleanCol = c.boolColumn()
		jsonCol = c.jsonColumn()
		uuidCol = c.uuidColumn()

		deprecatedStringCol = c.stringColumn().deprecated()
		deprecatedIntCol = c.intColumn().deprecated()
		deprecatedDoubleCol = c.doubleColumn().deprecated()
		deprecatedDateCol = c.dateColumn().deprecated()
		deprecatedDatetimeCol = c.dateTimeColumn().deprecated()
		deprecatedBooleanCol = c.boolColumn().deprecated()
		deprecatedJsonCol = c.jsonColumn().deprecated()
		deprecatedUuidCol = c.uuidColumn().deprecated()
	}
}

namespace EnumSchema {
	export class Foo {
		enumCol = c.enumColumn(c.createEnum('foo', 'bar'))

		deprecatedEnumCol = c.enumColumn(c.createEnum('foo', 'bar')).deprecated()
	}

	@c.Deprecated()
	export class DeprecatedFoo {
		enumCol = c.enumColumn(c.createEnum('foo', 'bar'))

		deprecatedEnumCol = c.enumColumn(c.createEnum('foo', 'bar')).deprecated()
	}
}

namespace OneHasOneSchema {
	export class Foo {
		oneHasOneInverseRel = c.oneHasOneInverse(Bar, 'oneHasOneOwningRel')
	}

	export class Bar {
		oneHasOneOwningRel = c.oneHasOne(Foo, 'oneHasOneInverseRel')
	}

	@c.Deprecated()
	export class DeprecatedFoo {
		deprecatedOneHasOneInverseRel = c.oneHasOneInverse(DeprecatedBar, 'deprecatedOneHasOneOwningRel').deprecated()
	}

	@c.Deprecated()
	export class DeprecatedBar {
		deprecatedOneHasOneOwningRel = c.oneHasOne(DeprecatedFoo, 'deprecatedOneHasOneInverseRel').deprecated()
	}
}

namespace OneHasManySchema {
	export class Foo {
		oneHasManyRel = c.oneHasMany(Bar, 'manyHasOneRel')
	}

	export class Bar {
		manyHasOneRel = c.manyHasOne(Foo, 'oneHasManyRel')
	}

	@c.Deprecated()
	export class DeprecatedFoo {
		deprecatedOneHasManyRel = c.oneHasMany(DeprecatedBar, 'deprecatedManyHasOneRel').deprecated()
	}

	@c.Deprecated()
	export class DeprecatedBar {
		deprecatedManyHasOneRel = c.manyHasOne(DeprecatedFoo, 'deprecatedOneHasManyRel').deprecated()
	}
}


namespace ManyHasManySchema {
	export class Foo {
		manyHasManyRel = c.manyHasMany(Bar, 'manyHasManyInverseRel')
	}

	export class Bar {
		manyHasManyInverseRel = c.manyHasManyInverse(Foo, 'manyHasManyRel')
	}

	@c.Deprecated()
	export class DeprecatedFoo {
		deprecatedManyHasManyRel = c.manyHasMany(DeprecatedBar, 'deeprecatedManyHasManyInverseRel').deprecated()
	}

	@c.Deprecated()
	export class DeprecatedBar {
		deeprecatedManyHasManyInverseRel = c.manyHasManyInverse(DeprecatedFoo, 'deprecatedManyHasManyRel').deprecated()
	}
}

namespace ReducedHasManySchema {
	export class Foo {
		locales = c.oneHasMany(FooLocale, 'foo')
	}

	@c.Unique('locale', 'foo')
	export class FooLocale {
		locale = c.stringColumn().notNull()
		foo = c.manyHasOne(Foo, 'locales')
	}

	@c.Deprecated()
	export class DeprecatedFoo {
		deprecatedLocales = c.oneHasMany(DeprecatedFooLocale, 'deprecatedFoo').deprecated()
	}

	@c.Unique('deprecatedLocale', 'deprecatedFoo')
	@c.Deprecated()
	export class DeprecatedFooLocale {
		deprecatedLocale = c.stringColumn().notNull().deprecated()
		deprecatedFoo = c.manyHasOne(DeprecatedFoo, 'deprecatedLocales').deprecated()
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
