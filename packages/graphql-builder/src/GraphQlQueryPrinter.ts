import { JSONValue } from '@contember/schema'
import { GraphQlField, GraphQlFragment, GraphQlFragmentSpread, GraphQlInlineFragment, GraphQlSelectionSet } from './nodes'

export type GraphQlPrintResult = { query: string; variables: Record<string, JSONValue> }

export class GraphQlQueryPrinter {
	private indentString = '\t'

	private variableCounter = 0
	private variables: Record<string, {
		type: string
		value: JSONValue
	}> = {}

	private usedFragments = new Set<string>()

	private body = ''


	public printDocument(
		operation: 'query' | 'mutation',
		select: GraphQlSelectionSet,
		fragments: Record<string, GraphQlFragment>,
	): GraphQlPrintResult {
		this.cleanState()
		this.processSelectionSet(select, 1)
		const body = this.body
		this.body = ''
		this.processUsedFragments(fragments)
		const fragmentsStr = this.body
		const variablesString = this.printVariables()
		const query = `${operation}${variablesString} {\n${body}}${fragmentsStr}\n`
		return {
			query: query,
			variables: Object.fromEntries(Object.entries(this.variables).map(([key, value]) => [key, value.value])),
		}
	}


	private processUsedFragments(fragments: Record<string, GraphQlFragment>): void {
		const printed = new Set()
		while (this.usedFragments.size > 0) {
			const fragmentName = this.usedFragments.values().next().value
			this.usedFragments.delete(fragmentName)
			if (printed.has(fragmentName)) {
				continue
			}
			printed.add(fragmentName)
			if (!fragments[fragmentName]) {
				throw new Error(`Unknown fragment ${fragmentName}`)
			}
			this.processFragment(fragments[fragmentName])
		}
	}

	private processFragment(fragment: GraphQlFragment): void {
		this.body += `\nfragment ${fragment.name} on ${fragment.type} {\n`
		this.processSelectionSet(fragment.selectionSet, 1)
		this.body += '}'
	}

	private printVariables(): string {
		let variablesString = ''
		let i = 0
		for (const [variableName, variable] of Object.entries(this.variables)) {
			if (i++ === 0) {
				variablesString += '('
			} else {
				variablesString += ', '
			}
			variablesString += `$${variableName}: ${variable.type}`
		}
		if (i > 0) {
			variablesString += ')'
		}
		return variablesString
	}

	private processSelectionSet(selectionSet: GraphQlSelectionSet, indent: number): void {
		for (const node of selectionSet) {
			if (node instanceof GraphQlField) {
				this.processField(node, indent)
			} else if (node instanceof GraphQlFragmentSpread) {
				this.body += this.indentString.repeat(indent) + '... ' + node.name + '\n'
				this.usedFragments.add(node.name)
			} else if (node instanceof GraphQlInlineFragment) {
				this.body += this.indentString.repeat(indent) + '... on ' + node.type + ' {\n'
				this.processSelectionSet(node.selectionSet, indent + 1)
				this.body += this.indentString.repeat(indent) + '}\n'
			}
		}
	}

	private processField(field: GraphQlField, indent: number): void {
		const indentString = this.indentString.repeat(indent)
		this.body += indentString + (field.alias && field.alias !== field.name ? (field.alias + ': ' + field.name) : field.name)
		let i = 0
		for (const [argName, arg] of Object.entries(field.args)) {
			if (arg.value === undefined) {
				continue
			}
			const variableName = `${argName}_${arg.graphQlType.replace(/[\W]/g, '')}_${this.variableCounter++}`
			if (i++ === 0) {
				this.body += '('
			} else {
				this.body += ', '
			}
			this.body += `${argName}: $${variableName}`
			this.variables[variableName] = {
				type: arg.graphQlType,
				value: arg.value,
			}
		}
		if (i > 0) {
			this.body += ')'
		}
		if (field.selectionSet) {
			this.body += ' {\n'
			this.processSelectionSet(field.selectionSet, indent + 1)
			this.body += this.indentString.repeat(indent) + '}'
		}
		this.body += '\n'
	}

	private cleanState(): void {
		this.body = ''
		this.variableCounter = 0
		this.variables = {}
		this.usedFragments = new Set<string>()
	}
}
