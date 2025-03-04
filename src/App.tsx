import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './App.css'
import PocketProvider from './contexts/PocketProvider'
import KanbanBoard from './KanbanBoard'

const queryClient = new QueryClient();

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <PocketProvider>
          <KanbanBoard />
        </PocketProvider>
      </QueryClientProvider>
    </>
  )
}

export default App
