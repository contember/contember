---
title: Custom components
---


In Contember, you can create custom components that support data binding. This allows you to build reusable components that fit your specific needs, while still benefiting from the automatic data fetching and saving provided by Contember's data binding system.

## Creating a custom component
To create a custom component that supports data binding, you will need to use the `Component` higher order component from the `@contember/interface` package. This function takes two arguments: the actual component implementation, and a static render function.

The actual component implementation is a regular React component, and you can use it like you would any other component. The static render function, on the other hand, is called during the "static render" phase, and it is used to specify which fields the component depends on.

When the actual implementation does not use hooks, the static render argument is optional - Contember will use the actual implementation for a static render.

Custom components that do not directly use data binding do not need to worry about static render, as Contember will always analyze their children. to support data binding. If the custom component uses hooks, a separate static render function must be provided as a second argument to Component.

### Simple custom data binding component

Simple components, which only wraps other components, can be written as follows:

```tsx
import { Component } from "@contember/interface";
import { InputField } from "@app/lib/form";
import { Card, CardContent } from "@app/lib/ui/card";

interface SeoFormProps {
  // ...
}

export const SeoForm = Component<SeoFormProps>((props) => {
  return (
    <Card>
      <CardContent>
        <InputField field={"title"} label={"Title"} />
        <InputField field={"description"} label={"Description"} />
      </CardContent>
    </Card>
  );
});
```

In this example, `SeoForm` is a custom component that renders a `Card` element with two `InputField` components inside. The `InputField` components are used to edit the title and description fields of the current entity.

:::note
This approach is suitable for simple components that do not use any hooks. If your component uses hooks, you will need to use the Component higher order component with two arguments, as described in the next section.
:::

### Custom data binding component with hooks

Hooks are not available during static render. This is why we need a separate static render function in this case.

```tsx
import { Component, Field, useEntity } from "@contember/interface";
import { InputField } from "@app/lib/form";
import { Card, CardContent } from "@app/lib/ui/card";
import { useState } from "react";

interface SeoFormProps {
  // ...
}

export const SeoForm = Component<SeoFormProps>((props) => {
  const entity = useEntity()
  const [state, setState] = useState()
  // ...  
  return (
    <Card>
      <CardContent>
        <InputField field={"title"} label={"Title"} />
        <InputField field={"description"} label={"Description"} />
      </CardContent>
    </Card>
  );
}, (props) => {
  return (
    <>
      <Field field={'title'} />
      <Field field={'description'} />
    </>
  )
});

```

In this example, the `SeoForm` component uses the `useEntity` and `useState` hooks, and therefore must include a static render function as the second argument for the `Component` higher-order component. During the static render phase, the `Field` components inside the static render function will be analyzed to determine the data dependencies of the SeoForm component.

### Ordinary components without data binding

If a component does not directly use data binding, you don't have to worry about static render as Contember will always analyze its children.

```tsx
const FormWrapper = ({ children }) => {
  const [state, setState] = useState()
  // ...
  return (
    <div /* .... */>
      {children}
    </div>
  )
}

// children will be analyzed:
const form = (
  <FormWrapper>
    <SeoForm />
  </FormWrapper>
)
```


## Using custom components

Once you have created a custom component, you can use it just like any other component. Simply import it and use it in your templates or other components.

#### Example how to use custom component
```typescript jsx
import { Slots, Title } from "@app/lib/layout";
import { Binding, PersistButton } from "@app/lib/binding";
import { EntitySubTree } from "@contember/interface";
import { SeoForm } from "./SeoForm";

export const create = () => (
  <>
    <Title>New Article</Title>
    <Binding>
      <Slots.Actions>
        <PersistButton />
      </Slots.Actions>
      <EntitySubTree entity="Article" isCreating>
        <SeoForm />
      </EntitySubTree>
    </Binding>
  </>
)

```
