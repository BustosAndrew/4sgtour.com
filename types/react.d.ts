import type { ReactNode } from 'react'

// Extend React types to support async Server Components in Next.js 15+
// This fixes TypeScript errors like: "'Component' cannot be used as a JSX component.
// Its return type 'Promise<Element>' is not a valid JSX element."
declare global {
  namespace JSX {
    type ElementType =
      | keyof JSX.IntrinsicElements
      | ((props: any) => Promise<ReactNode> | ReactNode)
  }
}

export {}
