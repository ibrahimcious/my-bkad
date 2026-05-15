import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main>
      <h1>BKAD Pasuruan Dashboard</h1>
      <p>Segera hadir</p>
    </main>
  )
}
