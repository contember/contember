import { Stage } from '../dtos/index.js'

export function formatSchemaName(stage: Pick<Stage, 'slug'>): string {
	return 'stage_' + stage.slug
}
