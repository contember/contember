import { ContentMutation, mutationFragments } from '@contember/client-content'
import { GraphQlField, GraphQlQueryPrinter } from '@contember/graphql-builder'

export const printMutation = (mutations: ContentMutation<any>[]) => {
	const printer = new GraphQlQueryPrinter()
	const selection = mutations.map((mut, i) => new GraphQlField('mut_' + i++, mut.fieldName, mut.args, mut.selection))
	return printer.printDocument('mutation', selection, mutationFragments)
}
