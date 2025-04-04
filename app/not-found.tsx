import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-orange-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Game Not Found</h2>
        <p className="text-gray-600 mb-6">The game you're looking for doesn't exist or has been completed.</p>
        <div className="flex flex-col gap-3">
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <Link href="/create-game">Create New Game</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/join-game">Join Existing Game</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

