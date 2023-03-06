import { buildVersion } from './build-version'

type ContemberOptions = {
	buildVersion?: boolean
}

export function contember(options: ContemberOptions) {
	return {
		...(options.buildVersion === false ? {} : { ...buildVersion() }),
	}
}
