import { ProjectGroupResolver } from './ProjectGroupResolver'

export interface S3Location {
	bucket: string
	prefix: string
}

const normalizePath = (path: string) => path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
export class S3LocationResolver {
	static PROJECT_PLACEHOLDER = '{project}'

	private readonly prefix: string

	constructor(
		private readonly bucket: string,
		prefix: string,
	) {
		const hasProjectPlaceholder = prefix.includes(S3LocationResolver.PROJECT_PLACEHOLDER) || bucket.includes(S3LocationResolver.PROJECT_PLACEHOLDER)
		this.prefix = normalizePath(prefix) + (hasProjectPlaceholder ? '' : `/${S3LocationResolver.PROJECT_PLACEHOLDER}`)
	}

	resolve(project: string | undefined, projectGroup: string | undefined): S3Location {
		if (!projectGroup && (this.bucket.includes(ProjectGroupResolver.GROUP_PLACEHOLDER) || this.prefix.includes(ProjectGroupResolver.GROUP_PLACEHOLDER))) {
			throw new S3IncompleteLocationError('project group is not defined')
		}
		const replace = (value: string) => (
			value.replace(ProjectGroupResolver.GROUP_PLACEHOLDER, projectGroup!).replace(S3LocationResolver.PROJECT_PLACEHOLDER, project ?? '')
		)
		return {
			bucket: replace(this.bucket),
			prefix: normalizePath(replace(this.prefix)),
		}
	}
}

export class S3IncompleteLocationError extends Error {}
