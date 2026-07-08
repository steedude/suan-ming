'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="max-w-md rounded-3xl border border-stone-200 bg-white/85 p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-teal-700">INTERNAL_SERVER_ERROR</p>
        <h1 className="font-display mt-3 text-2xl font-semibold text-stone-800">
          畫面暫時無法載入
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-500">
          系統已自動記錄這個錯誤，請稍後重試。
        </p>
        <Button type="button" onClick={reset} variant="brand" className="mt-6">
          重新載入
        </Button>
      </div>
    </main>
  )
}
