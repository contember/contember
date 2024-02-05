import { InputBare, InputLike } from '../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown'
import { Button } from '../ui/button'
import { XIcon } from 'lucide-react'
import * as React from 'react'
import {
	DataViewTextFilterInput,
	DataViewTextFilterMatchModeLabel,
	DataViewTextFilterMatchModeTrigger,
	DataViewTextFilterResetTrigger,
	TextFilterArtifactsMatchMode,
} from '@contember/react-dataview'


const MatchModeLabels: Record<TextFilterArtifactsMatchMode, string> = {
	'matches': 'Contains',
	'matchesExactly': 'Equals',
	'startsWith': 'Starts with',
	'endsWith': 'Ends with',
	'doesNotMatch': 'Does not contain',
}

export const DataViewTextFilter = ({ name }: {
	name: string
}) => {
	return (
		<InputLike className={'p-1 relative basis-1/4 min-w-40'}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button size={'sm'} variant={'secondary'} className={' px-1'}>
						<DataViewTextFilterMatchModeLabel name={name} render={MatchModeLabels} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-[160px]">
					{Object.entries(MatchModeLabels).map(([mode, label]) => (
						<DataViewTextFilterMatchModeTrigger name={name} mode={mode as TextFilterArtifactsMatchMode} key={mode}>
							<DropdownMenuItem className={'data-[active]:font-bold'}>
								{label}
							</DropdownMenuItem>
						</DataViewTextFilterMatchModeTrigger>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			<DataViewTextFilterInput name={name}>
				<InputBare placeholder={'Search'} className={'w-full ml-2'} />
			</DataViewTextFilterInput>

			<DataViewTextFilterResetTrigger name={name}>
				<Button variant={'ghost'} className={'absolute right-0 top-0'}>
					<XIcon className={'w-3 h-3'} />
				</Button>
			</DataViewTextFilterResetTrigger>
		</InputLike>
	)
}
