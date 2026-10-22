import { useState } from 'react'
import { ApfelBuehne, Medaillon } from '../apfel3d/Buehne.tsx'
import { darstellungAus, type Wert } from '../apfel3d/darstellung.ts'

// Entwicklerseite: Varianten des 3D-Modells nebeneinander (#/test3d)
const VARIANTEN: { name: string; werte: Wert[] }[] = [
  { name: 'gelb, Punkte, kein Rot', werte: [{ merkmal: 'schale_grundfarbe', wert: 'gruengelb' }, { merkmal: 'schale_deckfarbe_anteil', wert: '0' }, { merkmal: 'schale_lentizellen_anzahl', wert: '7' }, { merkmal: 'schale_lentizellen_art', wert: 'braun' }, { merkmal: 'schale_lentizellen_art', wert: 'umhoeft_gruen' }] },
  { name: 'gestreift rot', werte: [{ merkmal: 'schale_grundfarbe', wert: 'gelb' }, { merkmal: 'schale_deckfarbe_anteil', wert: '5' }, { merkmal: 'schale_deckfarbe_farbton', wert: 'rot' }, { merkmal: 'schale_deckfarbe_art', wert: 'gestreift' }] },
  { name: 'geflammt + verwaschen', werte: [{ merkmal: 'schale_grundfarbe', wert: 'gelb' }, { merkmal: 'schale_deckfarbe_anteil', wert: '7' }, { merkmal: 'schale_deckfarbe_farbton', wert: 'hellrot' }, { merkmal: 'schale_deckfarbe_art', wert: 'verwaschen' }, { merkmal: 'schale_deckfarbe_art', wert: 'geflammt' }, { merkmal: 'frucht_form', wert: 'konisch' }] },
  { name: 'berostet, flachrund', werte: [{ merkmal: 'schale_grundfarbe', wert: 'gelbgruen' }, { merkmal: 'schale_berostung_wangen', wert: '7' }, { merkmal: 'schale_berostung_stielgrube', wert: '7' }, { merkmal: 'frucht_form', wert: 'flachrund' }, { merkmal: 'frucht_groesse', wert: '7' }, { merkmal: 'schale_deckfarbe_anteil', wert: '3' }, { merkmal: 'schale_deckfarbe_farbton', wert: 'braunrot' }] },
  { name: 'dunkelrot, glänzend', werte: [{ merkmal: 'schale_deckfarbe_anteil', wert: '9' }, { merkmal: 'schale_deckfarbe_farbton', wert: 'dunkelrot' }, { merkmal: 'schale_beschaffenheit', wert: 'glaenzend' }, { merkmal: 'schale_lentizellen_art', wert: 'hell' }] },
  { name: 'grün, walzenförmig, gerippt', werte: [{ merkmal: 'schale_grundfarbe', wert: 'gruen' }, { merkmal: 'frucht_form', wert: 'walzenfoermig' }, { merkmal: 'frucht_rippung', wert: '7' }, { merkmal: 'frucht_kronung', wert: '9' }, { merkmal: 'schale_deckfarbe_anteil', wert: '1' }] },
  { name: 'Calville-artig, bereift', werte: [{ merkmal: 'schale_grundfarbe', wert: 'weisslichgelb' }, { merkmal: 'frucht_rippung', wert: '9' }, { merkmal: 'frucht_kronung', wert: '9' }, { merkmal: 'frucht_form', wert: 'glockenfoermig' }, { merkmal: 'schale_beschaffenheit', wert: 'bereift' }, { merkmal: 'schale_deckfarbe_anteil', wert: '1' }] },
  { name: 'orange marmoriert', werte: [{ merkmal: 'schale_grundfarbe', wert: 'orangegelb' }, { merkmal: 'schale_deckfarbe_anteil', wert: '5' }, { merkmal: 'schale_deckfarbe_farbton', wert: 'orange' }, { merkmal: 'schale_deckfarbe_art', wert: 'marmoriert' }] },
]

export default function Test3dSeite() {
  const [i, setI] = useState(0)
  const ps = VARIANTEN.map((v, k) => darstellungAus(v.werte, undefined, k + 3).p)
  return (
    <div className="seite">
      <div style={{ position: 'relative', height: 380, margin: '0 -16px' }}>
        <ApfelBuehne aepfel={[ps[i]]} className="buehne" />
      </div>
      <p className="klein">{VARIANTEN[i].name}</p>
      <div className="raster">
        {ps.map((p, k) => (
          <button key={k} className="raster-eintrag" onClick={() => setI(k)}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><Medaillon p={p} groesse={84} /></div>
            <span className="sehr-klein">{VARIANTEN[k].name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
