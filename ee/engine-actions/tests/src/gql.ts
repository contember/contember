import nodeAssert from 'assert'

// Used to allow prettier formatting of GraphQL queries
export const gql = (strings: TemplateStringsArray) => {
	nodeAssert.strictEqual(strings.length, 1)
	return strings[0]
}
