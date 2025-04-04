export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
      <p className="mt-4 text-orange-800 font-medium">Loading game data...</p>
      <p className="text-gray-500 text-sm mt-2">Please wait while we connect to the game server...</p>
    </div>
  )
}

