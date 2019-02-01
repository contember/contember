import { Stage } from '../dtos/Stage'

export function formatSchemaName(stage: Pick<Stage, 'slug'>): string {
	return 'stage_' + stage.slug
}
