import { BindingError } from '@contember/binding'

export const projectEnvironmentExtension = (slug: string | null | undefined) => {
	if (slug === undefined) {
		throw new BindingError('Environment does not contain project slug state.')
	}
	return {
		slug: slug ?? undefined,
	}
}
