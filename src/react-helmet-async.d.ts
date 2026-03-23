declare module 'react-helmet-async' {
  import * as React from 'react'

  export interface HelmetProps {
    children?: React.ReactNode
    [key: string]: unknown
  }

  export const Helmet: React.FC<HelmetProps>
  export const HelmetProvider: React.FC<{ children: React.ReactNode }>
}
