import React from 'react'
import './globals.css'

export default function layout({children}:{children:React.ReactNode}) {
  return (
    <html>
        <body>
            {children}
        </body>
    </html>
  )
}

