import { BindingError, Environment } from '@contember/binding'

export const projectEnvironmentExtension = Environment.createExtension((slug: string | null | undefined) => {
	if (slug === undefined) {
		throw new BindingError('Environment does not contain project slug state.')
	}
	return {
		slug: slug ?? undefined,
	}
})
