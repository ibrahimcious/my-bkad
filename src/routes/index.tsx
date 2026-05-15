import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background text-foreground">
      <h1 className="text-3xl font-semibold tracking-tight">
        BKAD Pasuruan Dashboard
      </h1>
      <p className="text-muted-foreground">Segera hadir</p>
    </main>
  )
}
