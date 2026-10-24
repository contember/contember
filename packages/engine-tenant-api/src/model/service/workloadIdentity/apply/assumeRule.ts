import { Acl } from '@contember/schema'
import * as Typesafe from '@contember/typesafe'

const membershipMatchRuleSchema = Typesafe.union(
	Typesafe.boolean,
	Typesafe.record(
		Typesafe.string,
		Typesafe.union(
			Typesafe.literal(true),
			Typesafe.noExtraProps(Typesafe.partial({
				variables: Typesafe.union(
					Typesafe.literal(true),
					Typesafe.record(Typesafe.string, Typesafe.union(Typesafe.literal(true), Typesafe.string)),
				),
			})),
		),
	),
)
const membershipMatchRuleSchemaCheck: Typesafe.Equals<Acl.MembershipMatchRule, ReturnType<typeof membershipMatchRuleSchema>> = true

export type ParseAssumeRuleResult =
	| { readonly ok: true; readonly rule: Acl.MembershipMatchRule }
	| { readonly ok: false; readonly message: string }

/** Parses an untrusted envelope rule (`Acl.MembershipMatchRule`), from the apply input or a stored row. */
export const parseAssumeRule = (input: unknown): ParseAssumeRuleResult => {
	try {
		return { ok: true, rule: membershipMatchRuleSchema(input) }
	} catch (e) {
		if (e instanceof Typesafe.ParseError) {
			return { ok: false, message: e.message }
		}
		throw e
	}
}
