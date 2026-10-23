// Ohne Konto: Einführung, alle Tabs, Sorten, rechtliche Seiten. Keine leeren Seiten, keine Skriptfehler.

import { test, expect } from '@playwright/test'
import { konsolenfehler, ohneEinfuehrung, nichtLeer, alsTest } from './hilfen.ts'

// Fehlermeldungen dieser Läufe zählen nicht als Nutzung
test.beforeEach(async ({ page }) => { await alsTest(page) })

test('Einführung erscheint beim ersten Start und lässt sich durchblättern', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Vier Äpfel, vier Fotos')).toBeVisible()
  await page.getByRole('button', { name: 'Weiter' }).click()
  await expect(page.getByText('Dein Apfel in 3D')).toBeVisible()
  await page.getByRole('button', { name: 'Weiter' }).click()
  await expect(page.getByText('Sorten entdecken')).toBeVisible()
  await page.getByRole('button', { name: 'Weiter' }).click()
  await page.getByRole('button', { name: 'Loslegen' }).click()
  await expect(page.getByText('Meine Bäume')).toBeVisible()
})

test('Alle Tabs und Seiten laden ohne Fehler', async ({ page }) => {
  const fehler = konsolenfehler(page)
  await ohneEinfuehrung(page)
  await page.goto('/')
  await expect(page.locator('canvas').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible()

  await page.getByRole('link', { name: 'Sorten' }).click()
  await expect(page.getByRole('searchbox', { name: 'Sorte suchen' })).toBeVisible()
  await page.getByPlaceholder('Name oder Synonym').fill('Gravensteiner')
  await page.getByText('Gravensteiner', { exact: true }).first().click()
  await expect(page.getByText('Herkunft', { exact: false }).first()).toBeVisible()

  await page.getByRole('link', { name: 'Wiese' }).click()
  await expect(page.getByText('Meine Wiese')).toBeVisible()

  for (const [pfad, text] of [['#/info', 'So funktioniert es'], ['#/konto', 'Darstellung'], ['#/sorten/bezug', 'Pomologen'], ['#/sorten/sammlung/renetten', 'Renetten'], ['#/sorten/monat/10', 'Genussreif im Oktober'], ['#/impressum', 'Loki-Schmidt-Platz'], ['#/datenschutz', 'Fehlerprotokoll'], ['#/nutzung', 'Sortenvorschläge'], ['#/installieren', 'Home-Bildschirm'], ['#/anmelden', 'Code per E-Mail schicken']] as const) {
    await page.goto('/' + pfad)
    await nichtLeer(page)
    await expect(page.getByText(text).first()).toBeVisible()
  }
  expect(fehler, fehler.join('\n')).toEqual([])
})

test('Kopfleiste führt zu Konto und Einstellungen; die Region steuert den Sorten-Tab', async ({ page }) => {
  const fehler = konsolenfehler(page)
  await ohneEinfuehrung(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Konto', exact: true }).click()
  await expect(page.getByText('Du bist nicht angemeldet')).toBeVisible()
  await page.getByRole('combobox', { name: 'Bundesland' }).selectOption('DE-HH')
  await page.getByRole('radio', { name: 'Dunkel' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('radio', { name: 'Wie das Gerät' }).click()
  await page.getByRole('link', { name: 'Sorten' }).click()
  await expect(page.getByText(/^Aus (Hamburg|der Nachbarschaft von Hamburg)$/)).toBeVisible()
  expect(fehler, fehler.join('\n')).toEqual([])
})

test('Sorten erkunden: Apfel des Tages, Sammlung, Reifekalender, Ratgeber', async ({ page }) => {
  const fehler = konsolenfehler(page)
  await ohneEinfuehrung(page)
  await page.goto('/#/sorten')
  await expect(page.getByLabel('Apfel des Tages')).toBeVisible()
  await page.getByRole('button', { name: 'Zufällige Sorte' }).click()
  await expect(page.getByLabel('Zufallsfund')).toBeVisible()

  await page.getByRole('link', { name: /Kalvillen/ }).click()
  await expect(page.getByRole('heading', { name: 'Kalvillen' })).toBeVisible()
  await expect(page.locator('a.zeile[href^="#/sorte/"]').first()).toBeVisible()
  await page.goBack()

  await page.getByRole('link', { name: /Welcher Apfelbaum passt zu dir/ }).click()
  await page.getByRole('combobox', { name: 'Bundesland' }).selectOption('DE-NW')
  await page.getByRole('button', { name: 'Weiter' }).click()
  await page.getByRole('radio', { name: /Rau/ }).click()
  await page.getByRole('radio', { name: /Normaler Gartenboden/ }).click()
  await page.getByRole('radio', { name: /Wiese oder großer Garten/ }).click()
  await page.getByRole('checkbox', { name: /Lagern bis ins Frühjahr/ }).click()
  await page.getByRole('button', { name: 'Weiter' }).click()
  await page.getByRole('radio', { name: /Ist mir nicht so wichtig/ }).click()
  await page.getByRole('radio', { name: /robust/ }).click()
  await page.getByRole('radio', { name: /Weiß ich nicht/ }).click()
  await page.getByRole('checkbox', { name: /Eine alte Sorte/ }).click()
  await page.getByRole('button', { name: 'Weiter' }).click()
  await expect(page.getByText('Diese Sorten passen')).toBeVisible()
  await expect(page.locator('a.karte-papier[href^="#/sorte/"]').first()).toBeVisible()
  await expect(page.getByText('Worauf du beim Kauf achten solltest')).toBeVisible()
  expect(fehler, fehler.join('\n')).toEqual([])
})

test('Fehlt nach einem Update ein Teil der App, lädt sie sich neu statt leer zu bleiben', async ({ page }) => {
  await ohneEinfuehrung(page)
  let abgefangen = 0
  // erste Anfrage nach dem Sortenporträt scheitert wie nach einem Update
  await page.route(/\/assets\/Sorte-[^/]+\.js$/, (route) => {
    if (abgefangen++ === 0) return route.fulfill({ status: 404, body: 'Not Found' })
    return route.continue()
  })
  await page.goto('/#/sorte/gravensteiner')
  await nichtLeer(page)
  await expect(page.getByText('Gravensteiner').first()).toBeVisible()
  expect(abgefangen).toBeGreaterThanOrEqual(2)
})

test('Ohne 3D-Grafik (kein WebGL) erscheint ein flacher Apfel statt eines Fehlers', async ({ page }) => {
  const fehler = konsolenfehler(page)
  await ohneEinfuehrung(page)
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    // WebGL abschalten, 2D-Zeichnen erlauben
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, art: string, ...rest: unknown[]) {
      if (/webgl/i.test(art)) return null
      return (original as (...a: unknown[]) => RenderingContext | null).call(this, art, ...rest)
    } as typeof original
  })
  await page.goto('/')
  await expect(page.getByRole('img', { name: 'Apfel' }).first()).toBeVisible()
  await expect(page.getByText('Da ist etwas schiefgelaufen')).toHaveCount(0)
  await page.getByRole('link', { name: 'Sorten' }).click()
  await expect(page.getByRole('searchbox', { name: 'Sorte suchen' })).toBeVisible()
  expect(fehler, fehler.join('\n')).toEqual([])
})
