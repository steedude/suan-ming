import { ImageResponse } from 'next/og'
import { siteConfig } from '@/configs/site'

export const alt = `${siteConfig.name} AI 八字解讀`
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background:
          'radial-gradient(circle at 18% 18%, #fff7d6 0, transparent 28%), linear-gradient(135deg, #fbf7ef 0%, #f6ead8 48%, #d7f3ed 100%)',
        color: '#1c1917',
        padding: 72,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            background: 'linear-gradient(135deg, #14b8a6, #0f766e)',
            color: '#fffaf0',
            fontSize: 38,
          }}
        >
          B
        </div>
        {siteConfig.alternateName}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div
          style={{
            maxWidth: 820,
            fontSize: 86,
            lineHeight: 1.02,
            fontWeight: 800,
            letterSpacing: -3,
          }}
        >
          AI Bazi reading for clearer decisions
        </div>
        <div style={{ maxWidth: 760, color: '#57534e', fontSize: 34, lineHeight: 1.35 }}>
          Turn your question and birth details into a structured chart and a practical
          direction.
        </div>
      </div>

      <div style={{ color: '#0f766e', fontSize: 28, fontWeight: 700 }}>
        {siteConfig.url.replace(/^https?:\/\//, '')}
      </div>
    </div>,
    size,
  )
}
