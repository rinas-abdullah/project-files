import { useCallback, useState } from 'react'
import { DEFAULT_NEED, parseRequest } from './data/antigram'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Marquee } from './components/Marquee'
import { Features } from './components/Features'
import { Beams } from './components/Beams'
import { Timeline } from './components/Timeline'
import { OpsConsole } from './components/OpsConsole'
import { Evidence, FinalCTA, Footer, References, Roadmap } from './components/Sections'

export default function App() {
  // `need`: antigen indexes the patient must be negative for. `runToken` bumps to replay the match animations.
  const [need, setNeed] = useState<number[]>(DEFAULT_NEED)
  const [runToken, setRunToken] = useState(0)
  const run = useCallback(() => setRunToken((t) => t + 1), [])

  const search = (query: string) => {
    const parsed = parseRequest(query)
    if (parsed.length) setNeed(parsed)
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
    window.setTimeout(run, 700)
  }

  return (
    <>
      <Nav />
      <main id="top">
        <Hero onSearch={search} />
        <Marquee />
        <Features need={need} runToken={runToken} onRun={run} />
        <Beams />
        <Timeline />
        <OpsConsole />
        <Evidence />
        <Roadmap />
        <References />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
