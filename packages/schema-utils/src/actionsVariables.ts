import { Actions } from '@contember/schema'

/** `{{name}}` in a webhook target's URL or header value, interpolated at dispatch time. */
const variablePattern = /\{\{(\w+)}}/g

export const replaceActionsVariables = (subject: string, resolve: (name: string) => string): string =>
	subject.replace(variablePattern, (_, name: string) => resolve(name))

/** The variable names a webhook target interpolates into its URL and headers, each listed once. */
export const getWebhookTargetVariableNames = (target: Actions.WebhookTarget): string[] => {
	const names = new Set<string>()
	for (const subject of [target.url, ...Object.values(target.headers ?? {})]) {
		for (const match of subject.matchAll(variablePattern)) {
			names.add(match[1])
		}
	}
	return [...names]
}
