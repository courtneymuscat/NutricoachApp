'use client'

import { useEffect, useRef, useState } from 'react'

// BarcodeDetector is available in Chrome/Android and Safari 17.4+
declare class BarcodeDetector {
  constructor(options?: { formats: string[] })
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>
  static getSupportedFormats(): Promise<string[]>
}

type Props = {
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting')
  const [errorMsg, setErrorMsg] = useState('')
  const activeRef = useRef(true)

  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setStatus('error')
      setErrorMsg('Barcode scanning is not supported in this browser. Use Chrome on Android or Safari 17.4+.')
      return
    }

    let stream: MediaStream | null = null

    const detector = new BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
    })

    async function scan() {
      if (!activeRef.current || !videoRef.current) return
      try {
        const barcodes = await detector.detect(videoRef.current)
        if (barcodes.length > 0 && activeRef.current) {
          activeRef.current = false
          onScan(barcodes[0].rawValue)
          return
        }
      } catch {
        // detection frame failed — continue
      }
      if (activeRef.current) requestAnimationFrame(scan)
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        })
        if (!activeRef.current) { stream.getTracks().forEach(t => t.stop()); return }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setStatus('scanning')
          scan()
        }
      } catch {
        setStatus('error')
        setErrorMsg('Camera access denied. Please allow camera permission and try again.')
      }
    }

    start()

    return () => {
      activeRef.current = false
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm">
        <p className="text-white font-semibold text-sm">Scan Barcode</p>
        <button
          type="button"
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
          aria-label="Close scanner"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Scanning overlay */}
        {status === 'scanning' && (
          <>
            {/* Dimmed edges */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Scan window */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-72 h-44">
                {/* Cutout — transparent centre */}
                <div className="absolute inset-0 bg-transparent rounded-xl ring-2 ring-white/30" />

                {/* Corner brackets */}
                {[
                  'top-0 left-0 border-t-2 border-l-2 rounded-tl-xl',
                  'top-0 right-0 border-t-2 border-r-2 rounded-tr-xl',
                  'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl',
                  'bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-7 h-7 border-white ${cls}`} />
                ))}

                {/* Animated scan line */}
                <div className="absolute left-2 right-2 h-0.5 bg-blue-400/80 rounded-full animate-scan-line" />
              </div>
            </div>

            <p className="absolute bottom-12 left-0 right-0 text-center text-white/70 text-sm">
              Point camera at a food barcode
            </p>
          </>
        )}

        {/* Starting state */}
        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
            <svg className="animate-spin h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-white/60 text-sm">Starting camera...</p>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black px-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="h-7 w-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-white font-medium">{errorMsg}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan-line {
          0%, 100% { top: 8px; opacity: 1; }
          50% { top: calc(100% - 8px); opacity: 0.8; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
          position: absolute;
        }
      `}</style>
    </div>
  )
}
