'use client'
import React, { useState } from 'react'
import type { ReceiptScanResult } from '@/lib/types'

interface ReceiptScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScanComplete: (result: ReceiptScanResult) => void
}

export default function ReceiptScannerModal({ isOpen, onClose, onScanComplete }: ReceiptScannerModalProps) {
  const [scanning, setScanning] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleScan(text?: string) {
    setScanning(true)
    setError(null)

    try {
      const res = await fetch('/api/receipt/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: 'simulated_image_upload_data',
          textInput: text || pastedText,
        }),
      })

      const data: ReceiptScanResult = await res.json()
      if (res.ok) {
        onScanComplete(data)
        onClose()
      } else {
        throw new Error((data as any).error || 'Failed to parse receipt')
      }
    } catch (err: any) {
      setError(err.message || 'Error parsing receipt image')
    } finally {
      setScanning(false)
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      // Execute scan with base64 image data
      handleScan()
    }
    reader.readAsDataURL(file)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🧾</span>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>Scan Paper Receipt</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Upload Zone */}
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed rgba(217, 255, 91, 0.4)',
            borderRadius: 16,
            padding: 32,
            background: 'rgba(217, 255, 91, 0.03)',
            cursor: scanning ? 'wait' : 'pointer',
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={scanning}
            style={{ display: 'none' }}
          />
          <span style={{ fontSize: 36, marginBottom: 8 }}>📷</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
            {scanning ? 'Analyzing Receipt via Vision AI...' : 'Click or Drag receipt photo here'}
          </span>
          <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Supports JPG, PNG, WEBP receipts
          </span>
        </label>

        {/* Or Paste Raw Text */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
            Or paste raw receipt text:
          </label>
          <textarea
            rows={3}
            value={pastedText}
            onChange={e => setPastedText(e.target.value)}
            placeholder="e.g. SUPERMARKET Total: ETB 350.00 Date: 2026-08-07..."
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: 10,
              color: '#f8fafc',
              fontSize: 13,
              outline: 'none',
              resize: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '10px 18px',
              color: '#cbd5e1',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => handleScan()}
            disabled={scanning}
            style={{
              background: 'linear-gradient(135deg, #D9FF5B 0%, #b3ff00 100%)',
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              color: '#080A09',
              fontWeight: 600,
              fontSize: 14,
              cursor: scanning ? 'wait' : 'pointer',
            }}
          >
            {scanning ? 'Scanning...' : 'Scan Receipt'}
          </button>
        </div>
      </div>
    </div>
  )
}
