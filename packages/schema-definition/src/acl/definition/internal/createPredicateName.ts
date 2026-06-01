import { WhenDefinition } from '../permissions.js'

export const createPredicateName = (when: WhenDefinition) => {
	const json = JSON.stringify(when)
	return json.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 30).replace(/^_|_$/g, '')
}
