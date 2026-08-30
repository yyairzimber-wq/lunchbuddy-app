import { useRef, useState } from 'react'
import { compressImage } from '../utils/image'

export default function PhotoPicker({ photoUrl, emoji, onChange }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const dataUrl = await compressImage(file)
      onChange(dataUrl)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="photo-picker">
      <div className="photo-picker__preview">
        {photoUrl ? <img src={photoUrl} alt="" /> : <span>{emoji}</span>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
      <div className="photo-picker__actions">
        <button type="button" className="btn btn--small" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? 'טוען...' : '📷 בחר/י תמונה'}
        </button>
        {photoUrl && (
          <button type="button" className="btn btn--small btn--ghost" onClick={() => onChange(null)}>
            הסר תמונה
          </button>
        )}
      </div>
    </div>
  )
}
