import { AnyFileTypeProps } from '@contember/react-uploader';
import { AudioFileTypeProps } from '@contember/react-uploader';
import { ClassAttributes } from 'react';
import { ComponentProps } from 'react';
import { DataViewSortingDirections } from '@contember/react-dataview';
import { DataViewUnionFilterFields } from '@contember/react-dataview';
import { ErrorAccessor } from '@contember/interface';
import { FormCheckboxProps } from '@contember/react-form';
import { FormInputProps } from '@contember/react-form';
import { FormRadioItemProps } from '@contember/react-form';
import { ForwardRefExoticComponent } from 'react';
import { HTMLAttributes } from 'react';
import { ImageFileTypeProps } from '@contember/react-uploader';
import { InputHTMLAttributes } from 'react';
import { LabelProps } from '@radix-ui/react-label';
import { NamedExoticComponent } from 'react';
import * as React_2 from 'react';
import { ReactNode } from 'react';
import { RefAttributes } from 'react';
import { RepeaterProps } from '@contember/react-repeater';
import { S3FileOptions } from '@contember/react-uploader';
import { SugaredQualifiedEntityList } from '@contember/interface';
import { SugaredRelativeEntityList } from '@contember/interface';
import { SugaredRelativeSingleEntity } from '@contember/interface';
import { SugaredRelativeSingleField } from '@contember/interface';
import { TextareaHTMLAttributes } from 'react';
import { UploaderBaseFieldProps } from '@contember/react-uploader';
import { VideoFileTypeProps } from '@contember/react-uploader';

/**
 * `AudioField` is a specialized upload component for handling audio files. It provides built-in file validation, an audio preview, and metadata tracking.
 *
 * #### Example: Basic usage
 * ```tsx
 * <AudioField
 *   label="Podcast File"
 *   urlField="audio.url"
 * />
 * ```
 *
 * #### Example: With metadata fields
 * ```tsx
 * <AudioField
 *   label="Podcast File"
 *   baseField="audio"
 *   urlField="url"
 *   durationField="duration"
 *   fileNameField="fileName"
 *   fileSizeField="fileSize"
 *   fileTypeField="fileType"
 *   lastModifiedField="lastModified"
 *   accept={{ 'audio/*': ['.mp3', '.wav', '.ogg'] }}
 * />
 * ```
 */
export declare const AudioField: NamedExoticComponent<AudioFieldProps>;

export declare type AudioFieldProps = BaseUploadFieldProps & AudioFileTypeProps;

/**
 * AudioRepeaterField component - Multiple audio file upload manager
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Features
 * - Handles ordered lists of audio files
 * - Audio player preview for uploaded files
 * - Supports common audio formats
 * - File size validation
 *
 * #### Example: Basic usage
 * ```tsx
 * <AudioRepeaterField
 *   label="Podcast Episodes"
 *   field="episodes"
 *   urlField="audio.url"
 *   orderBy="createdAt"
 * />
 * ```
 *
 * #### Example: Sortable with baseField and some optional props
 * ```tsx
 * <AudioRepeaterField
 *   field="episodes"
 *   baseField="audio"
 *   urlField="url"
 *   sortableBy="order"
 *   durationField="duration"
 *   fileNameField="fileName"
 *   fileSizeField="fileSize"
 *   fileTypeField="fileType"
 *   lastModifiedField="lastModified"
 *   label="Audio file"
 * />
 * ```
 */
export declare const AudioRepeaterField: React_2.NamedExoticComponent<AudioRepeaterFieldProps>;

export declare type AudioRepeaterFieldProps = BaseFileRepeaterFieldProps & AudioFileTypeProps;

export declare type BaseFileRepeaterFieldProps = Omit<FormContainerProps, 'children'> & RepeaterProps & UploaderBaseFieldProps & {
    dropzonePlaceholder?: ReactNode;
    actions?: ReactNode;
    edit?: ReactNode;
    noDestroy?: boolean;
    getUploadOptions?: (file: File) => S3FileOptions;
};

export declare type BaseUploadFieldProps = Omit<FormContainerProps, 'children'> & UploaderBaseFieldProps & {
    dropzonePlaceholder?: ReactNode;
    actions?: ReactNode;
    edit?: ReactNode;
    /**  Disables file removal capability */
    noDestroy?: boolean;
    getUploadOptions?: (file: File) => S3FileOptions;
};

/**
 * CheckboxField is a component for boolean fields. Must be used within an Entity context.
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Features:
 * - Renders as a standard checkbox input
 * - Label appears adjacent to the checkbox
 * - Required state reflects field nullability (can be overridden)
 *
 * #### Example: Basic usage
 * ```tsx
 * <CheckboxField
 *   field="isPublished"
 *   label="Publish immediately"
 * />
 * ```
 */
export declare const CheckboxField: React_2.NamedExoticComponent<Omit<FormCheckboxProps, "children"> & Omit<FormContainerProps, "children"> & {
    required?: boolean;
    inputProps?: Omit<React_2.InputHTMLAttributes<HTMLInputElement>, "defaultValue">;
}>;

export declare type CheckboxFieldProps = Omit<FormCheckboxProps, 'children'> & Omit<FormContainerProps, 'children'> & {
    required?: boolean;
    inputProps?: Omit<React_2.InputHTMLAttributes<HTMLInputElement>, 'defaultValue'>;
};

/**
 * `FileField` is a generic file upload component that supports any file type.
 *
 * #### Example: Basic usage
 * ```tsx
 * <FileField label="Document" urlField="file.url" />
 * ```
 *
 * #### Example: With metadata fields and custom dropzone placeholder
 * ```tsx
 * <FileField
 *   label="Document"
 *   baseField="document"
 *   urlField="file.url"
 *   fileNameField="fileName"
 *   fileSizeField="fileSize"
 *   fileTypeField="fileType"
 *   lastModifiedField="lastModified"
 *   dropzonePlaceholder="Drag PDF here"
 *   accept={{ 'application/*': ['.pdf'] }}
 * />
 * ```
 */
export declare const FileField: NamedExoticComponent<FileFieldProps>;

export declare type FileFieldProps = BaseUploadFieldProps & AnyFileTypeProps;

/**
 * FileRepeaterField component - Generic multi-file upload repeater
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Features
 * - Handles any file type in a list format
 * - File type icon display
 * - Customizable preview components
 * - Sortable document lists
 *
 * #### Example: Basic usage
 * ```tsx
 * <FileRepeaterField
 *   label="Attachments"
 *   field="attachments"
 *   urlField="file.url"
 *   orderBy="createdAt"
 * />
 * ```
 *
 * #### Example: Sortable with baseField and some optional props
 * ```tsx
 * <FileRepeaterField
 *  field="attachments"
 *  baseField="file"
 *  urlField="url"
 *  sortableBy="order"
 *  fileNameField="fileName"
 *  fileSizeField="fileSize"
 *  fileTypeField="fileType"
 *  lastModifiedField="lastModified"
 *  label="File"
 * />
 * ```
 */
export declare const FileRepeaterField: React_2.NamedExoticComponent<FileRepeaterFieldProps>;

export declare type FileRepeaterFieldProps = BaseFileRepeaterFieldProps & AnyFileTypeProps;

/**
 * Props {@link FormContainerProps}.
 *
 * `FormContainer` is a layout component for form fields, providing consistent styling and handling
 * of labels, descriptions, and error messages. It ensures accessibility and state management
 * within form contexts.
 *
 * #### Example: Basic usage
 * ```tsx
 * <FormContainer label="Email" description="Enter a valid email address" required errors={errors}>
 *   <FormInput field="email" />
 * </FormContainer>
 * ```
 */
export declare const FormContainer: NamedExoticComponent<FormContainerProps>;

/**
 * Props for the {@link FormContainer} component.
 */
export declare interface FormContainerProps {
    /**
     * The label for the form element.
     */
    label?: ReactNode;
    /**
     * The description text for the form element.
     */
    description?: ReactNode;
    /**
     * The child components or form elements to render within the container.
     */
    children: ReactNode;
    /**
     * The error message to display.
     */
    errors?: ErrorAccessor.Error[] | ReactNode;
    /**
     * Indicates whether the form element
     */
    required?: boolean;
}

/**
 * FormContainerUI component - Wrapper for individual form fields
 *
 * #### Purpose
 * Creates consistent spacing and layout for form field groups
 *
 * #### Features
 * - Vertical flex layout
 * - Full width container
 * - Uses Tailwind classes: `flex flex-col gap-2 w-full`
 *
 * #### Example
 * ```tsx
 * <FormContainerUI>
 *   <FormLabelUI>Email</FormLabelUI>
 *   <InputField field="email" />
 * </FormContainerUI>
 * ```
 */
export declare const FormContainerUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

/**
 * FormDescriptionUI component - Styled text for form field descriptions
 *
 * #### Purpose
 * Displays secondary help text below form fields
 *
 * #### Features
 * - Small muted text style
 * - Uses Tailwind classes: `text-[0.8rem] text-muted-foreground`
 *
 * #### Example
 * ```tsx
 * <FormDescriptionUI>
 *   Must be at least 8 characters
 * </FormDescriptionUI>
 * ```
 */
export declare const FormDescriptionUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLParagraphElement> & HTMLAttributes<HTMLParagraphElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLParagraphElement>>;

/**
 * FormErrorUI component - Error message display for form validation
 *
 * #### Purpose
 * Shows validation error messages in consistent destructive style
 *
 * #### Features
 * - Red destructive color scheme
 * - Small bold text
 * - Uses Tailwind classes: `text-[0.8rem] font-medium text-destructive`
 *
 * #### Example
 * ```tsx
 * <FormErrorUI>Invalid email format</FormErrorUI>
 * ```
 */
export declare const FormErrorUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLParagraphElement> & HTMLAttributes<HTMLParagraphElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLParagraphElement>>;

/**
 * FormLabelUI component - Styled label for form fields
 *
 * #### Purpose
 * Displays accessible labels with required state indicators
 *
 * #### Features
 * - Left-aligned text
 * - Dynamic required indicator (red asterisk)
 * - Variant support for required state
 * - Default required marker: '*'
 *
 * #### Variants
 * - `required`: Controls display of required indicator (true/false)
 *
 * #### Example: Basic usage
 * ```tsx
 * <FormLabelUI>Password</FormLabelUI>
 * ```
 *
 * #### Example: With required indicator
 * ```tsx
 * <FormLabelUI required>Username</FormLabelUI>
 * ```
 */
export declare const FormLabelUI: ForwardRefExoticComponent<Omit<Omit<LabelProps & RefAttributes<HTMLLabelElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLLabelElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
} & {
required?: boolean | null | undefined;
}, "ref"> & RefAttributes<HTMLLabelElement>>;

/**
 * FormLabelWrapperUI component - Container for form labels
 *
 * #### Purpose
 * Wraps label elements for proper alignment and spacing
 *
 * #### Features
 * - Flex container layout
 * - Base Tailwind class: `flex`
 *
 * #### Example
 * ```tsx
 * <FormLabelWrapperUI>
 *   <FormLabelUI>Email Address</FormLabelUI>
 * </FormLabelWrapperUI>
 * ```
 */
export declare const FormLabelWrapperUI: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

/**
 * FormLayout component - Core layout container for form elements
 *
 * #### Purpose
 * Provides consistent spacing and layout structure for form components
 *
 * #### Features
 * - Vertical flex layout with gap spacing
 * - Side margins for visual balance
 * - Uses Tailwind classes: `flex flex-col gap-2 mx-4`
 *
 * #### Example
 * ```tsx
 * <FormLayout>
 *   <InputField field="username" />
 * </FormLayout>
 * ```
 */
export declare const FormLayout: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLDivElement>>;

/**
 * ImageField component - Specialized file upload for images
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Features
 * - Handles image file uploads with preview
 * - Supports common image formats (from ImageFileTypeProps)
 * - Integrated drag-and-drop zone
 * - Auto-generated preview using UploadedImageView
 * - Optional custom destruction control
 *
 * #### Example: Basic usage
 * ```tsx
 * <ImageField
 *   label="Profile Picture"
 *   urlField="avatar.url"
 *   dropzonePlaceholder="Drag image here"
 * />
 * ```
 * #### Example: With baseField and custom dropzone
 * ```tsx
 * <ImageField
 *   baseField="image"
 *   urlField="url"
 *   widthField="width"
 *   heightField="height"
 *   fileNameField="fileName"
 *   fileSizeField="fileSize"
 *   fileTypeField="fileType"
 *   lastModifiedField="lastModified"
 *   label="Image file"
 *   description="Some description of the image file."
 *   dropzonePlaceholder={(
 *     <UploaderDropzoneAreaUI className="w-60">
 *       <UploadIcon className="w-12 h-12 text-gray-400" />
 *       <div className="font-semibold text-sm">Drop files here</div>
 *       <div className="text-xs">or</div>
 *       <div className="flex gap-2 items-center text-xs">
 *         <Button size="sm" variant="outline">Browse</Button>
 *         <div onClick={e => e.stopPropagation()}>
 *           <SelectImage />
 *         </div>
 *       </div>
 *     </UploaderDropzoneAreaUI>
 *   )}
 * />
 * ```
 */
export declare const ImageField: NamedExoticComponent<ImageFieldProps>;

export declare type ImageFieldProps = BaseUploadFieldProps & ImageFileTypeProps;

/**
 * ImageRepeaterField component - Multiple image upload with sorting capabilities
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Features
 * - Handles multiple image uploads in a list format
 * - Drag-and-drop reordering of images
 * - Auto-generated image previews
 * - Progress indicators during upload
 * - Integrated removal controls
 *
 * #### Example: Basic usage
 * ```tsx
 * <ImageRepeaterField
 *   label="Gallery Images"
 *   field="images"
 *   urlField="image.url"
 *   orderBy="createdAt"
 * />
 * ```
 *
 * #### Example: With custom dropzone and actions
 * ```tsx
 * <ImageRepeaterField
 *   field="imageList.items"
 *   baseField="image"
 *   sortableBy="order"
 *   urlField="url"
 *   widthField="width"
 *   heightField="height"
 *   fileNameField="fileName"
 *   fileSizeField="fileSize"
 *   fileTypeField="fileType"
 *   lastModifiedField="lastModified"
 *   label="Image file"
 *   description="Some description of the image file."
 *   dropzonePlaceholder={(
 *     <UploaderDropzoneAreaUI className="w-60">
 *       <UploadIcon className="w-12 h-12 text-gray-400" />
 *       <div className="font-semibold text-sm">Drop files here</div>
 *       <div className="text-xs">or</div>
 *       <div className="flex gap-2 items-center text-xs">
 *         <Button size="sm" variant="outline">Browse</Button>
 *         <div onClick={e => e.stopPropagation()}>
 *           <SelectImageRepeater />
 *         </div>
 *       </div>
 *     </UploaderDropzoneAreaUI>
 *   )}
 * />
 * ```
 */
export declare const ImageRepeaterField: React_2.NamedExoticComponent<ImageRepeaterFieldProps>;

export declare type ImageRepeaterFieldProps = BaseFileRepeaterFieldProps & ImageFileTypeProps;

declare const Input: ForwardRefExoticComponent<Omit<ClassAttributes<HTMLInputElement> & InputHTMLAttributes<HTMLInputElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
} & {
inputSize?: "default" | "sm" | "lg" | null | undefined;
variant?: "default" | "ghost" | null | undefined;
}, "ref"> & RefAttributes<HTMLInputElement>>;

/**
 * Props {@link InputFieldProps}.
 *
 * `InputField` is a form input component that integrates with {@link FormFieldScope},
 * {@link FormContainer}, and {@link FormInput} to provide a structured and configurable input field.
 *
 * #### Example: Basic usage
 * ```tsx
 * <InputField field="title" label="Article title" />
 * ```
 *
 * #### Example: With additional input properties
 * ```tsx
 * <InputField
 *   field="title"
 *   label="Article title"
 *   inputProps={{ placeholder: 'Enter a title' }}
 * />
 */
export declare const InputField: React_2.NamedExoticComponent<InputFieldProps>;

/**
 * Props for the {@link InputField} component.
 */
export declare type InputFieldProps = Omit<FormInputProps, 'children'> & Omit<FormContainerProps, 'children'> & {
    required?: boolean;
    inputProps?: ComponentProps<typeof Input>;
};

/**
 * MultiSelectField component for managing multiple-entity (hasMany) relationships.
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`)
 *
 * #### Features
 * - Multiple entity selection with chip display
 * - Supports custom option rendering and creation of new entities
 * - Maintains selection order based on user interaction
 * - Query-based option filtering with initial sorting
 * - Integrated error state handling from parent form
 *
 * #### Example: Basic usage
 * ```tsx
 * <MultiSelectField
 *   field="categories"
 *   label="Article Categories"
 * >
 *   <Field field="name" />
 * </MultiSelectField>
 * ```
 *
 * #### Example: With creation form and sorting
 * ```tsx
 * <MultiSelectField
 *   field="tags"
 *   label="Article Tags"
 *   initialSorting={{ name: 'asc' }}
 *   createNewForm={<TagCreateForm />}
 * >
 *   <Field field="name" />
 * </MultiSelectField>
 * ```
 */
export declare const MultiSelectField: NamedExoticComponent<MultiSelectFieldProps>;

export declare type MultiSelectFieldProps = MultiSelectInputProps & Omit<FormContainerProps, 'children' | 'required'>;

declare type MultiSelectInputProps = {
    /** Specifies the field to bind the selection to. */
    field: SugaredRelativeEntityList['field'];
    /** An array of entities to populate the selection list. */
    options?: SugaredQualifiedEntityList['entities'];
    /** React nodes for rendering the content of each selected item. */
    children: ReactNode;
    /** Custom placeholder text when no items are selected. */
    placeholder?: ReactNode;
    /** Content for creating a new entity. */
    createNewForm?: ReactNode;
    /** Field used for querying and filtering options. */
    queryField?: DataViewUnionFilterFields;
    /** Defines the initial sorting order for the options. */
    initialSorting?: DataViewSortingDirections;
};

/**
 * RadioEnumField is a component for enum fields with radio button selection. Must be used within an Entity context.
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * Features:
 * - Can auto-generate options from enum definitions
 * - Supports horizontal or vertical layout
 * - Options can be provided explicitly or derived from enum labels
 *
 * #### Example: Basic usage
 * ```tsx
 * <RadioEnumField
 *   field="status"
 *   label="Article Status"
 *   orientation="horizontal"
 *   options={[
 *     { value: 'draft', label: 'Draft' },
 *     { value: 'published', label: 'Published' }
 *   ]}
 * />
 * ```
 *
 * #### Example: Using enum auto-detection
 * ```tsx
 * // Using enum auto-detection
 * <RadioEnumField
 *   field="category"
 *   label="Article Category"
 * />
 * ```
 */
export declare const RadioEnumField: React_2.NamedExoticComponent<RadioEnumFieldProps>;

export declare type RadioEnumFieldProps = Omit<FormRadioItemProps, 'children' | 'value'> & Omit<FormContainerProps, 'children'> & {
    required?: boolean;
    options?: Record<string, ReactNode> | Array<{
        value: null | string | number | boolean;
        label: React_2.ReactNode;
    }>;
    orientation?: 'horizontal' | 'vertical';
    inputProps?: Omit<React_2.InputHTMLAttributes<HTMLInputElement>, 'defaultValue'>;
};

/**
 * SelectEnumField component for enum value selection with auto-option detection.
 *
 * #### Requirements
 * - Field must be an enum type when using auto-detection
 * - Manual options must be provided if enum not detected
 *
 * #### Features
 * - Auto-detects enum options from schema definition
 * - Supports mixed value types (string, number, boolean, null)
 * - Two option formats: object map or array of {value/label}
 * - Required field validation with error feedback
 * - Custom placeholder support
 * - Pre-persist validation for required fields
 *
 * #### Example: Auto-detected enum usage
 * ```tsx
 * <SelectEnumField
 *   field="articleStatus"
 *   label="Publication Status"
 *   required
 * />
 * ```
 *
 * #### Example: Manual options with mixed types
 * ```tsx
 * <SelectEnumField
 *   field="notificationSettings"
 *   label="Alert Preferences"
 *   options={[
 *     { value: 'email', label: 'Email Notifications' },
 *     { value: 1, label: 'SMS Alerts' },
 *     { value: null, label: 'No Notifications' }
 *   ]}
 *   placeholder="Select preference..."
 * />
 * ```
 *
 * #### Example: Object-based options
 * ```tsx
 * <SelectEnumField
 *   field="userRole"
 *   label="Account Type"
 *   options={{
 *     admin: 'Administrator',
 *     user: 'Standard User',
 *     guest: 'Temporary Access'
 *   }}
 * />
 * ```
 */
export declare const SelectEnumField: NamedExoticComponent<SelectEnumFieldProps>;

export declare type SelectEnumFieldProps = Omit<FormContainerProps, 'children'> & {
    field: SugaredRelativeSingleField['field'];
    options?: Record<string, React.ReactNode> | {
        value: null | string | number | boolean;
        label: React.ReactNode;
    }[];
    placeholder?: React.ReactNode;
    defaultValue?: string;
    required?: boolean;
};

/**
 * `SelectField` is a component for single-entity relationship selection (hasOne). Must be used within an Entity context.
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Features
 * - Manages hasOne relationships through a dropdown interface.
 * - Supports custom option rendering and creation of new entities.
 * - Sorts options by a specified field.
 * - Query-based option filtering.
 *
 * #### Example: Basic usage
 * ```tsx
 * <SelectField
 *   field="country"
 *   label="Home Country"
 * >
 *   <Field field="name" />
 * </SelectField>
 * ```
 *
 * #### Example: With sorting and form allowing creation of new entities
 * ```tsx
 * <SelectField
 *   field="author"
 *   label="Author"
 *   initialSorting={{ name: 'asc' }}
 *   createNewForm={<CountryForm />}
 * >
 *   <Field field="name" />
 * </SelectField>
 * ```
 *
 * #### Example: With query-based filtering
 * ```tsx
 * <SelectField
 *   field="author"
 *   label="Author"
 *   options="Author[archived != false]"
 * >
 *   <Field field="name" />
 * </SelectField>
 * ```
 */
export declare const SelectField: NamedExoticComponent<SelectFieldProps>;

export declare type SelectFieldProps = SelectInputProps & Omit<FormContainerProps, 'children'>;

declare type SelectInputProps = {
    /** The field to bind the selection to (`SugaredRelativeSingleEntity['field']`) */
    field: SugaredRelativeSingleEntity['field'];
    /** React nodes for rendering each value or additional content inside the selection UI. */
    children: ReactNode;
    /** Defines the entity options to be displayed. */
    options?: SugaredQualifiedEntityList['entities'];
    /** Custom placeholder content when no value is selected. */
    placeholder?: ReactNode;
    /** Content for creating a new entity, displayed within a `CreateEntityDialog`. */
    createNewForm?: ReactNode;
    /** Specifies the field to query for filtering or sorting. */
    queryField?: DataViewUnionFilterFields;
    /** Defines the initial sorting order of the options. */
    initialSorting?: DataViewSortingDirections;
    /** Boolean flag to enforce validation for the selection input. */
    required?: boolean;
};

/**
 * SortableMultiSelectField component for ordered multi-entity relationships with drag-and-drop.
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`)
 * - Requires sort field configuration via `sortableBy` prop
 *
 * #### Features
 * - Drag-and-drop reordering of selected items
 * - Visual sorting indicators during drag operations
 * - Customizable sort field storage
 * - Connection point management for complex relationships
 * - Inherits all MultiSelectField features
 *
 * #### Example: Basic usage
 * ```tsx
 * <SortableMultiSelectField
 *   field="chapterPages"
 *   label="Page Order"
 *   sortableBy="pageNumber"
 *   connectAt="bookChapter"
 * >
 *   <Field field="content" />
 * </SortableMultiSelectField>
 * ```
 */
export declare const SortableMultiSelectField: NamedExoticComponent<SortableMultiSelectFieldProps>;

export declare type SortableMultiSelectFieldProps = SortableMultiSelectInputProps & Omit<FormContainerProps, 'children' | 'required'>;

declare type SortableMultiSelectInputProps = {
    field: SugaredRelativeEntityList['field'];
    /** Field name used to store sort order */
    sortableBy: SugaredRelativeSingleField['field'];
    /** Field name used to connect the selected entity */
    connectAt: SugaredRelativeSingleEntity['field'];
    children: ReactNode;
    options?: SugaredQualifiedEntityList['entities'];
    placeholder?: ReactNode;
    createNewForm?: ReactNode;
    queryField?: DataViewUnionFilterFields;
    initialSorting?: DataViewSortingDirections;
};

/**
 * @deprecated use `FormContainer` instead
 *
 * StandaloneFormContainer component.
 *
 * #### Deprecation Notice
 * This component is deprecated and will be removed in future versions.
 * Use `FormContainer` instead.
 *
 * #### Migration Example
 * ```tsx
 * // Old:
 * <StandaloneFormContainer label="Name">
 *   <FormInput field="name" />
 * </StandaloneFormContainer>
 *
 * // New:
 * <FormContainer label="Name">
 *   <FormInput field="name" />
 * </FormContainer>
 * ```
 */
export declare const StandaloneFormContainer: NamedExoticComponent<FormContainerProps>;

declare const TextareaAutosize: ForwardRefExoticComponent<Omit<Omit<ClassAttributes<HTMLTextAreaElement> & TextareaHTMLAttributes<HTMLTextAreaElement> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
}, "ref"> & RefAttributes<HTMLTextAreaElement> & {
minRows?: number;
maxRows?: number;
}, "ref"> & RefAttributes<HTMLTextAreaElement>>;

/**
 * `TextareaField` is a form textarea component that integrates with `FormFieldScope`,
 * `FormContainer`, and `FormInput` to provide a structured and configurable multi-line input field.
 *
 * Must be used within a form context.
 *
 * #### Features
 * - Supports field scoping for form state management
 * - Includes a label and description for accessibility
 * - Handles required validation
 * - Supports automatic resizing with `TextareaAutosize`
 * - Allows custom input properties via `inputProps`
 *
 * #### Example: Basic usage
 * ```tsx
 * <TextareaField
 *   field="bio"
 *   label="Biography"
 *   description="Tell us about yourself"
 *   required
 *   inputProps={{ placeholder: "Write something..." }}
 * />
 * ```
 */
export declare const TextareaField: React_2.NamedExoticComponent<TextareaFieldProps>;

/**
 * Props for the {@link TextareaField} component.
 */
export declare type TextareaFieldProps = Omit<FormInputProps, 'children'> & Omit<FormContainerProps, 'children'> & {
    required?: boolean;
    inputProps?: ComponentProps<typeof TextareaAutosize>;
};

/**
 * `VideoField` is a specialized upload component for handling video files with built-in preview capabilities.
 *
 * #### Example: Basic usage
 * ```tsx
 * <VideoField
 *   label="Demo Video"
 *   urlField="video.url"
 * />
 * ```
 *
 * #### Example: With metadata fields
 * ```tsx
 * <VideoField
 *   label="Demo Video"
 *   baseField="video"
 *   urlField="url"
 *   durationField="duration"
 *   fileNameField="fileName"
 *   fileSizeField="fileSize"
 *   fileTypeField="fileType"
 *   lastModifiedField="lastModified"
 *   accept={{ 'video/*': ['.mp4', '.webm', '.ogg'] }}
 * />
 * ```
 */
export declare const VideoField: NamedExoticComponent<VideoFieldProps>;

export declare type VideoFieldProps = BaseUploadFieldProps & VideoFileTypeProps;

/**
 * VideoRepeaterField component - Ordered video upload collection
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Features
 * - Manages multiple video uploads
 * - Video preview thumbnails
 * - Drag-and-drop sequence control
 * - Upload progress tracking
 *
 * #### Example: Basic usage
 * ```tsx
 * <VideoRepeaterField
 *   label="Course Videos"
 *   field="courses"
 *   urlField="video.url"
 *   orderBy="createdAt"
 * />
 * ```
 *
 * #### Example: Sortable with baseField and some optional props
 * ```tsx
 * <VideoRepeaterField
 *   field="courses"
 *   baseField="video"
 *   urlField="url"
 *   sortableBy="order"
 *   durationField="duration"
 *   fileNameField="fileName"
 *   fileSizeField="fileSize"
 *   fileTypeField="fileType"
 *   lastModifiedField="lastModified"
 *   label="Course Videos"
 * />
 * ```
 */
export declare const VideoRepeaterField: React_2.NamedExoticComponent<VideoRepeaterFieldProps>;

export declare type VideoRepeaterFieldProps = BaseFileRepeaterFieldProps & VideoFileTypeProps;

export { }
