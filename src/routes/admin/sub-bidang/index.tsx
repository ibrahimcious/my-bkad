import { type FormEvent, useRef, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { getSubBidangMapping, uploadSubBidangMapping } from '@/modules/budget'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

export const Route = createFileRoute('/admin/sub-bidang/')({
  loader: () => getSubBidangMapping(),
  component: SubBidangPage,
})

type Status =
  | { type: 'success'; text: string }
  | { type: 'error'; text: string }

function SubBidangPage() {
  const mapping = Route.useLoaderData()
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState(false)

  const subBidangCount = new Set(mapping.map((row) => row.subBidang)).size

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = fileInput.current?.files?.[0]
    if (!file) {
      setStatus({
        type: 'error',
        text: 'Pilih berkas pemetaan terlebih dahulu.',
      })
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadSubBidangMapping({ data: formData })
      if (result.ok) {
        const skipped =
          result.warnings.length > 0
            ? ` ${result.warnings.length} baris dilewati atau digabung.`
            : ''
        setStatus({
          type: 'success',
          text: `Berhasil memetakan ${result.count} Sub Kegiatan.${skipped}`,
        })
        if (fileInput.current) fileInput.current.value = ''
        await router.invalidate()
      } else {
        setStatus({ type: 'error', text: result.error })
      }
    } catch {
      setStatus({
        type: 'error',
        text: 'Terjadi kesalahan. Silakan coba lagi.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Pemetaan Sub Bidang
          </h1>
          <p className="text-sm text-muted-foreground">
            Unggah berkas Excel pemetaan Sub Kegiatan ke Sub Bidang. Pemetaan
            ini terpisah dari data LRA dan hanya perlu diperbarui bila struktur
            organisasi berubah. Setiap unggahan menggantikan pemetaan
            sebelumnya.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <Input
            ref={fileInput}
            type="file"
            accept=".xlsx"
            required
            className="max-w-sm"
          />
          <Button type="submit" disabled={busy}>
            {busy ? 'Memproses…' : 'Unggah'}
          </Button>
        </form>

        {status ? (
          <p
            role="alert"
            className={
              status.type === 'success'
                ? 'text-sm text-green-700'
                : 'text-sm text-destructive'
            }
          >
            {status.text}
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold tracking-tight">
          Pemetaan Saat Ini
        </h2>
        {mapping.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada pemetaan. Unggah berkas untuk memulai.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {mapping.length} Sub Kegiatan dipetakan ke {subBidangCount} Sub
            Bidang.
          </p>
        )}
      </section>
    </div>
  )
}
