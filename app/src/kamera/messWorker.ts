// Messung eines Fotos im Hintergrund-Thread
import { werteFotoAus } from './messung.ts'
import type { Punkt } from './blatterkennung.ts'

self.onmessage = (e: MessageEvent<{ data: ArrayBuffer; width: number; height: number; ecken?: Punkt[]; nr: number }>) => {
  const { data, width, height, ecken, nr } = e.data
  try {
    const a = werteFotoAus({ data: new Uint8ClampedArray(data), width, height }, ecken)
    const transfer = [a.freigestellt, a.blatt].filter(Boolean).map((b) => b!.data.buffer as ArrayBuffer)
    ;(self as unknown as Worker).postMessage({ nr, auswertung: a }, transfer)
  } catch (err) {
    ;(self as unknown as Worker).postMessage({ nr, fehler: String(err) })
  }
}
