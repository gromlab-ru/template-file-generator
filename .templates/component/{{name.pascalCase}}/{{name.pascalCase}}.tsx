import { FC } from 'react'
import styles from './{{name.pascalCase}}.module.css'
import cl from 'clsx'

interface IOwnProps {
  className?: string
}

export const {{name.pascalCase}}: FC<IOwnProps> = ({className}) => {
  return (
    <div className={cl(styles.wrapper, className)}>
      {{name.pascalCase}}
    </div>
  )
}

