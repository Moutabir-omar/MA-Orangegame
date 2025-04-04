export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-12 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-orange-800 font-medium">Loading games...</p>
      </div>
    </div>
  )
}

