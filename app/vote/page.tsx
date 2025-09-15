import { VoteForm } from '@/components/VoteForm'

export default function VotePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            投票システム
          </h1>
          <p className="text-gray-600">
            団体を選択して、評価を付けてください
          </p>
        </header>
        
        <main>
          <VoteForm />
        </main>
        
        <footer className="text-center mt-12 text-sm text-gray-500">
          <p>※ 1つの端末から各団体に1回のみ投票可能です</p>
        </footer>
      </div>
    </div>
  )
}
