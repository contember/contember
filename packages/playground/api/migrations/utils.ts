import { ContentMutation, mutationFragments } from '@contember/client-content'
import { GraphQlField, GraphQlQueryPrinter } from '@contember/graphql-builder'

export const printMutation = (mutations: ContentMutation<any>[]) => {
	const printer = new GraphQlQueryPrinter()
	const selection = mutations.map((mut, i) => new GraphQlField('mut_' + i++, mut.fieldName, mut.args, mut.selection))
	return printer.printDocument('mutation', selection, mutationFragments)
}

export const uniqGenerator = <T>(generator: () => T): () => T => {
	const set = new Set<string>()
	return () => {
		let value: T
		let i = 0
		do {
			value = generator()
			if (i++ > 100) {
				throw new Error('Failed to generate unique value')
			}
		} while (set.has(JSON.stringify(value)))
		set.add(JSON.stringify(value))
		return value
	}
}
