import * as Typesafe from '@contember/typesafe'
import { Validation } from '@contember/schema'

const messageSchema = Typesafe.intersection(
	Typesafe.object({
		text: Typesafe.string,
	}),
	Typesafe.partial({
		parameters: Typesafe.array(Typesafe.union(Typesafe.string, Typesafe.number)),
	}),
)
const literalArgumentFactory = <T extends Typesafe.Json>(inner: Typesafe.Type<T>) => Typesafe.object({
	type: Typesafe.literal(Validation.ArgumentType.literal),
	value: inner,
})

const validatorArgumentSchema = Typesafe.object({
	type: Typesafe.literal(Validation.ArgumentType.validator),
	validator: (v, p): Validation.Validator => validatorSchema(v, p),
})
const pathArgumentSchema = Typesafe.object({
	type: Typesafe.literal(Validation.ArgumentType.path),
	path: Typesafe.array(Typesafe.string),
})

const validatorSchema = Typesafe.union(
	Typesafe.object({
		operation: Typesafe.literal('and'),
		args: Typesafe.array(validatorArgumentSchema),
	}),
	Typesafe.object({
		operation: Typesafe.literal('or'),
		args: Typesafe.array(validatorArgumentSchema),
	}),
	Typesafe.object({
		operation: Typesafe.literal('conditional'),
		args: Typesafe.tuple(validatorArgumentSchema, validatorArgumentSchema),
	}),
	Typesafe.object({
		operation: Typesafe.literal('pattern'),
		args: Typesafe.tuple(literalArgumentFactory(Typesafe.tuple(Typesafe.string, Typesafe.string))),
	}),
	Typesafe.object({
		operation: Typesafe.literal('lengthRange'),
		args: Typesafe.tuple(
			literalArgumentFactory(Typesafe.union(Typesafe.null_, Typesafe.number)),
			literalArgumentFactory(Typesafe.union(Typesafe.null_, Typesafe.number)),
		),
	}),
	Typesafe.object({
		operation: Typesafe.literal('range'),
		args: Typesafe.tuple(
			literalArgumentFactory(Typesafe.union(Typesafe.null_, Typesafe.number)),
			literalArgumentFactory(Typesafe.union(Typesafe.null_, Typesafe.number)),
		),
	}),
	Typesafe.object({
		operation: Typesafe.literal('equals'),
		args: Typesafe.tuple(literalArgumentFactory(Typesafe.anyJson)),
	}),
	Typesafe.object({
		operation: Typesafe.literal('not'),
		args: Typesafe.tuple(validatorArgumentSchema),
	}),
	Typesafe.object({
		operation: Typesafe.literal('empty'),
		args: Typesafe.tuple(),
	}),
	Typesafe.object({
		operation: Typesafe.literal('defined'),
		args: Typesafe.tuple(),
	}),
	Typesafe.object({
		operation: Typesafe.literal('inContext'),
		args: Typesafe.tuple(pathArgumentSchema, validatorArgumentSchema),
	}),
	Typesafe.object({
		operation: Typesafe.literal('every'),
		args: Typesafe.tuple(validatorArgumentSchema),
	}),
	Typesafe.object({
		operation: Typesafe.literal('any'),
		args: Typesafe.tuple(validatorArgumentSchema),
	}),
	Typesafe.object({
		operation: Typesafe.literal('filter'),
		args: Typesafe.tuple(validatorArgumentSchema, validatorArgumentSchema),
	}),
)
const validatorSchemaCheck: Typesafe.Equals<Validation.Validator, ReturnType<typeof validatorSchema>> = true

const validationRuleSchema = Typesafe.object({
	validator: validatorSchema as Typesafe.Type<Validation.Validator>,
	message: messageSchema,
})

export const validationSchema = Typesafe.record(
	Typesafe.string,
	Typesafe.record(Typesafe.string, Typesafe.array(validationRuleSchema)),
)
