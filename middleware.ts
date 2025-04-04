import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const path = url.pathname

  // Check if the user is trying to access a game-related page
  if (path.startsWith("/game") || path.startsWith("/lobby")) {
    // Check if gameId is present in the URL
    const gameId = url.searchParams.get("gameId")

    if (!gameId) {
      // Redirect to home if no gameId is provided
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/game/:path*", "/lobby/:path*"],
}

