import { BlockRepeaterProps } from '@contember/react-block-repeater';
import { NamedExoticComponent } from 'react';

/**
 * `DefaultBlockRepeater` component is a versatile and customizable block repeater shipped with a UI.
 * It allows for the creation and management of repeatable content blocks within a form.
 *
 * Supports two modes of operation:
 *   - **Inline Edit Mode**: By providing only `children`, the blocks can be edited inline.
 *   - **Dual-Mode**: By providing both `form` and `children`, the component supports a dual-mode where blocks can be edited in a separate form view.
 *
 * #### Props {@link DefaultBlockRepeaterProps}
 * - field or entities, sortableBy, discriminationField, children
 *
 * #### Example
 * ```tsx
 * <DefaultBlockRepeater field="blocks" sortableBy="order" discriminationField="type">
 *   <Block
 *     name="text"
 *     label={<><TextIcon /> Text</>}
 *     form={<>
 *       <InputField field="title" label="Title" />
 *       <TextareaField field="content" label="Content" />
 *     </>}
 *     children={<>
 *       <div className="flex">
 *         <div className="w-64 space-y-2">
 *           <h2 className="text-xl font-bold">
 *             <Field field="title" />
 *           </h2>
 *           <p>
 *             <Field field="content" />
 *           </p>
 *         </div>
 *       </div>
 *     </>
 *     }
 *   />
 * </DefaultBlockRepeater>
 * ```
 */
export declare const DefaultBlockRepeater: NamedExoticComponent<BlockRepeaterProps>;

/**
 * Props for {@link DefaultBlockRepeater} component.
 */
export declare type DefaultBlockRepeaterProps = BlockRepeaterProps;

export { }
