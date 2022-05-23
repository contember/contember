import { ReactNode } from 'react'
import { ContemberLogoImage, DimensionsSwitcher, Layout as ContemberLayout, Link, Logo } from '@contember/admin'
import { Navigation } from './Navigation'

export const Layout = (props: { children?: ReactNode }) => (
	<ContemberLayout
		sidebarHeader={<Link to="index"><Logo image={<ContemberLogoImage withLabel />} /></Link>}
		switchers={<>
			<DimensionsSwitcher
				optionEntities="Locale"
				orderBy="code asc"
				dimension="locale"
				labelField="code"
				slugField="code"
				maxItems={1}
			/>
			{/*<DimensionsSwitcher*/}
			{/*	optionEntities="LocaleDialect[locale.code = $locale]"*/}
			{/*	orderBy="label asc"*/}
			{/*	dimension="dialect"*/}
			{/*	labelField="label"*/}
			{/*	slugField="label"*/}
			{/*	maxItems={1}*/}
			{/*/>*/}
		</>}
		navigation={<Navigation />}
		children={props.children}
	/>
)
