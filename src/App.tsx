import './App.css'
import PocketProvider from './contexts/PocketProvider'
import KanbanBoard from './KanbanBoard'

function App() {
  return (
    <>
      <PocketProvider>
        <KanbanBoard />
      </PocketProvider>
    </>
  )
}

export default App
