import { type FormEvent, useRef, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { getUploadHistory, uploadPendapatanLRA } from '@/modules/budget'
import { formatDateID } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

export const Route = createFileRoute('/admin/upload-pendapatan/')({
  loader: () => getUploadHistory({ data: 'PENDAPATAN' }),
  component: UploadPendapatanPage,
})

type Status =
  | { type: 'success'; text: string }
  | { type: 'error'; text: string }

function UploadPendapatanPage() {
  const history = Route.useLoaderData()
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = fileInput.current?.files?.[0]
    if (!file) {
      setStatus({
        type: 'error',
        text: 'Pilih berkas LRA Pendapatan terlebih dahulu.',
      })
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadPendapatanLRA({ data: formData })
      if (result.ok) {
        const skipped =
          result.warnings.length > 0
            ? ` ${result.warnings.length} baris dilewati.`
            : ''
        setStatus({
          type: 'success',
          text: `Berhasil mengunggah ${result.rowCount} baris data.${skipped}`,
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
            Unggah Data LRA Pendapatan
          </h1>
          <p className="text-sm text-muted-foreground">
            Unggah berkas Excel LRA dari SIPD Penatausahaan. Hanya bagian
            Pendapatan yang diproses. Setiap unggahan menggantikan seluruh
            data pendapatan sebelumnya.
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

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">
          Riwayat Unggah
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada unggahan.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Nama Berkas</th>
                <th className="py-2 pr-4 font-medium">Jumlah Baris</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} className="border-b">
                  <td className="py-2 pr-4">{entry.fileName}</td>
                  <td className="py-2 pr-4">{entry.rowCount}</td>
                  <td className="py-2 pr-4">
                    {entry.status === 'SUCCESS' ? 'Berhasil' : 'Gagal'}
                  </td>
                  <td className="py-2">
                    {formatDateID(new Date(entry.uploadedAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
