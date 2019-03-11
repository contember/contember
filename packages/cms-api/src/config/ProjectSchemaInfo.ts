import { Acl } from 'cms-common'
import { SchemaDiff } from '../content-schema/differ/modifications'

namespace ProjectSchemaInfo {
	export interface Migration {
		version: string
		diff: SchemaDiff
	}
}

export default ProjectSchemaInfo
