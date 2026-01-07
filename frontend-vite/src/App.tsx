import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MoviesPage from './pages/MoviesPage'
import MovieDetailPage from './pages/MovieDetailPage'
import ActorsPage from './pages/ActorsPage'
import ActorDetailPage from './pages/ActorDetailPage'
import DirectorsPage from './pages/DirectorsPage'
import DirectorDetailPage from './pages/DirectorDetailPage'
import RelationshipsPage from './pages/RelationshipsPage'
import FavoritesPage from './pages/FavoritesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="movies" element={<MoviesPage />} />
          <Route path="movies/:id" element={<MovieDetailPage />} />
          <Route path="actors" element={<ActorsPage />} />
          <Route path="actors/:id" element={<ActorDetailPage />} />
          <Route path="directors" element={<DirectorsPage />} />
          <Route path="directors/:id" element={<DirectorDetailPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="relationships" element={<RelationshipsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App