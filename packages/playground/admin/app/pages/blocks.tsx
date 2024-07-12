import { Binding, PersistButton } from '@app/lib/binding'
import { Slots } from '@app/lib/layout'
import * as React from 'react'
import { EntitySubTree, EntityView, Field, HasOne, StaticRender } from '@contember/interface'
import { DefaultBlockRepeater } from '@app/lib/block-repeater'
import { ImageField, InputField, RadioEnumField, TextareaField } from '@app/lib/form'
import { UploadedImageView } from '@app/lib/upload'
import { Block } from '@contember/react-block-repeater'
import { AlertOctagonIcon, ColumnsIcon, ImageIcon, TextIcon } from 'lucide-react'
import { cn } from '@app/lib/utils'

export default () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<EntitySubTree entity={'BlockList(unique=unique)'} setOnCreate={'(unique=unique)'}>
			<DefaultBlockRepeater field={'blocks'} sortableBy="order" discriminationField="type">
				<Block
					name="text"
					label={<><TextIcon /> Text</>}
					form={<>
						<InputField field={'title'} label={'Title'} />
						<TextareaField field={'content'} label={'Content'} />
					</>}
					children={<>
						<div className="flex">
							<div className="w-64 space-y-2">
								<h2 className="text-xl font-bold">
									<Field field={'title'} />
								</h2>
								<p>
									<Field field={'content'} />
								</p>
							</div>
						</div>
					</>
					}
				/>
				<Block
					name="image"
					label={<><ImageIcon /> Image</>}
					form={<>
						<InputField field={'title'} label={'Title'} />
						<ImageField baseField={'image'} urlField="url" label={'Image'} />
					</>}
					children={<>
						<div className="flex">
							<div className="flex flex-col gap-2">
								<div className="space-y-2">
									<h2 className="text-xl font-bold">
										<Field field={'title'} />
									</h2>
									<div className="border">
										<HasOne field="image">
											<UploadedImageView urlField={'url'} />
										</HasOne>
									</div>

								</div>
							</div>
						</div>
					</>}
				/>
				<Block
					name="textWithImage"
					label={<><ColumnsIcon /> Image with text</>}
					form={<>
						<InputField field={'title'} label={'Title'} />
						<TextareaField field={'content'} label={'Content'} />
						<ImageField baseField={'image'} urlField="url" label={'Image'} />
						<RadioEnumField field={'imagePosition'} options={{ left: 'Left', right: 'Right' }} />
					</>}
					children={<>

						<EntityView render={it => {
							return (
								<div className="flex">
									<div className={cn('border', it.getField('imagePosition').value === 'right' ? 'order-2' : '')}>
										<HasOne field="image">
											<UploadedImageView urlField={'url'} />
										</HasOne>
									</div>
									<div className="w-64 px-4 space-y-2">
										<h2 className="text-xl font-bold">
											<Field field={'title'} />
										</h2>
										<p>
											<Field field={'content'} />
										</p>
									</div>
								</div>
							)
						}} />
					</>}
				/>
				<Block
					name="hero"
					label={<><AlertOctagonIcon /> Hero</>}
					form={<>
						<InputField field={'title'} label={'Title'} />
						<TextareaField field={'content'} label={'Content'} />
						<InputField field={'color'} label={'Color'} inputProps={{ type: 'color' }} />
					</>}
					children={<>
						<StaticRender>
							<Field field={'color'} />
						</StaticRender>
						<EntityView render={it => {
							return (
								<div className="flex">
									<div className="w-96 p-4 gap-2 flex flex-col items-center" style={{
										backgroundColor: it.getField<string>('color').value ?? undefined,
										color: getTextColor(it.getField<string>('color').value ?? ''),
									}}>
										<h2 className="text-4xl font-bold">
											<Field field={'title'} />
										</h2>
										<p className="text-xl">
											<Field field={'content'} />
										</p>
									</div>
								</div>
							)
						}} />
					</>}
				/>
			</DefaultBlockRepeater>
		</EntitySubTree>
	</Binding>
</>

function getTextColor(backgroundColor: string) {
	if (!backgroundColor) {
		return 'black'
	}
	// Extract RGB values from a color in hex format
	const r = parseInt(backgroundColor.slice(1, 3), 16)
	const g = parseInt(backgroundColor.slice(3, 5), 16)
	const b = parseInt(backgroundColor.slice(5, 7), 16)

	// Calculate the luminance
	const luminance = 0.2126 * (r / 255) ** 2.2 +
		0.7152 * (g / 255) ** 2.2 +
		0.0722 * (b / 255) ** 2.2

	// Use a luminance threshold of 0.179 to decide on text color
	return luminance > 0.179 ? 'black' : 'white'
}


export const withoutDualRender = () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<EntitySubTree entity={'BlockList(unique=unique)'} setOnCreate={'(unique=unique)'}>
			<DefaultBlockRepeater field={'blocks'} sortableBy="order" discriminationField="type">
				<Block
					name="text"
					label={<><TextIcon /> Text</>}
				>
					<InputField field={'title'} label={'Title'} />
					<TextareaField field={'content'} label={'Content'} />
				</Block>
				<Block
					name="image"
					label={<><ImageIcon /> Image</>}
				>
					<InputField field={'title'} label={'Title'} />
					<ImageField baseField={'image'} urlField="url" label={'Image'} />
				</Block>
				<Block
					name="textWithImage"
					label={<><span className="inline-flex gap-1"><ImageIcon /> <TextIcon /></span> Image with text</>}
				>
					<InputField field={'title'} label={'Title'} />
					<TextareaField field={'content'} label={'Content'} />
					<ImageField baseField={'image'} urlField="url" label={'Image'} />
					<RadioEnumField field={'imagePosition'} options={{ left: 'Left', right: 'Right' }} />
				</Block>
				<Block
					name="hero"
					label={<><AlertOctagonIcon /> Hero</>}
				>
					<InputField field={'title'} label={'Title'} />
					<TextareaField field={'content'} label={'Content'} />
					<InputField field={'color'} label={'Color'} inputProps={{ type: 'color' }} />
				</Block>
			</DefaultBlockRepeater>
		</EntitySubTree>
	</Binding>
</>
