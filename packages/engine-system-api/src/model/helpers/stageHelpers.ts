import { Stage } from '../dtos'

export function formatSchemaName(stage: Pick<Stage, 'slug'>): string {
	return 'stage_' + stage.slug
}
