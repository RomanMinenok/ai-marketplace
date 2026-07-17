import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Search from './pages/Search'
import PluginDetail from './pages/PluginDetail'
import ArtifactDetail from './pages/ArtifactDetail'
import WhatsNew from './pages/WhatsNew'
import GettingStarted from './pages/GettingStarted'
import { SiteDataProvider } from './lib/SiteDataContext'

export default function App() {
  return (
    <SiteDataProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/plugin/:name" element={<PluginDetail />} />
            <Route path="/artifact/:kind/:plugin/:name" element={<ArtifactDetail />} />
            <Route path="/whats-new" element={<WhatsNew />} />
            <Route path="/getting-started" element={<GettingStarted />} />
          </Routes>
        </Layout>
      </HashRouter>
    </SiteDataProvider>
  )
}
