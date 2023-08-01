import { Intent, Scheme } from '../../types'

export type StyleProviderProps = {
	displayContents?: boolean;
	overridesLucideIcons?: boolean;
	scheme?: Scheme;
	themeContent?: Intent;
	themeControls?: Intent;
	transparent?: boolean;
	suppressFocusRing?: boolean;
}
