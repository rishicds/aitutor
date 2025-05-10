import type React from "react"
import ClientLayout from "./ClientLayout"

// It's good practice to define metadata for your page.
// import type { Metadata } from 'next'
// export const metadata: Metadata = {
//   title: 'My App',
//   description: 'My awesome application',
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
