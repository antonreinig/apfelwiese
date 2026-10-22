// Blatterkennung im Hintergrund-Thread, damit die Kameravorschau flüssig bleibt
import { erkenneBlatt } from './blatterkennung.ts'

self.onmessage = (e: MessageEvent<{ data: ArrayBuffer; width: number; height: number; nr: number }>) => {
  const { data, width, height, nr } = e.data
  const befund = erkenneBlatt({ data: new Uint8ClampedArray(data), width, height })
  ;(self as unknown as Worker).postMessage({ befund, nr })
}
