import { Component, type ReactNode } from 'react'
import { meldeFehler, istNachladefehler, einmalNeuLaden } from './protokoll.ts'

// Fängt Fehler beim Darstellen einer Seite ab. Statt einer leeren Seite erscheint ein Hinweis
// mit „Neu laden“. Fehlt nach einem Update ein Teil der App, lädt sie sich einmal selbst neu.

interface Zustand { fehler: Error | null }

export class Fehlergrenze extends Component<{ children: ReactNode; schluessel?: string }, Zustand> {
  state: Zustand = { fehler: null }

  static getDerivedStateFromError(fehler: Error): Zustand {
    return { fehler }
  }

  componentDidCatch(fehler: Error, info: { componentStack?: string | null }) {
    if (istNachladefehler(fehler) && einmalNeuLaden()) return
    meldeFehler(istNachladefehler(fehler) ? 'nachladen' : 'darstellung', fehler, info.componentStack?.slice(0, 300) ?? undefined)
  }

  componentDidUpdate(vorher: { schluessel?: string }) {
    // anderer Tab gewählt: neu versuchen
    if (this.state.fehler && vorher.schluessel !== this.props.schluessel) this.setState({ fehler: null })
  }

  render() {
    if (!this.state.fehler) return this.props.children
    return (
      <div className="seite" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 12 }}>
        <h1 className="name titel">Da ist etwas schiefgelaufen</h1>
        <p className="klein" style={{ maxWidth: 360 }}>Diese Seite ließ sich nicht anzeigen. Der Fehler wurde gemeldet. Meist hilft es, die App neu zu laden.</p>
        <button className="knopf haupt" onClick={() => window.location.reload()}>Neu laden</button>
        <a className="klein" href="#/">Zur Startseite</a>
      </div>
    )
  }
}
