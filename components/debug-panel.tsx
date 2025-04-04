"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseClient } from "@/lib/supabase-client"

export function DebugPanel({ gameId, playerId }: { gameId: string; playerId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchDebugInfo = async () => {
    setIsLoading(true)
    try {
      // Test Supabase connection
      const { data: connectionTest, error: connectionError } = await supabaseClient
        .from("games")
        .select("count")
        .limit(1)

      // Get game info
      const { data: gameData, error: gameError } = await supabaseClient
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single()

      // Get players
      const { data: playersData, error: playersError } = await supabaseClient
        .from("players")
        .select("*")
        .eq("game_id", gameId)

      setDebugInfo({
        timestamp: new Date().toISOString(),
        connection: {
          success: !connectionError,
          error: connectionError ? connectionError.message : null,
          data: connectionTest,
        },
        game: {
          data: gameData,
          error: gameError ? gameError.message : null,
        },
        players: {
          data: playersData,
          error: playersError ? playersError.message : null,
        },
        environment: {
          supabaseUrl: supabaseClient.supabaseUrl.substring(0, 20) + "...",
          hasAnonKey: !!supabaseClient.supabaseKey,
          gameId,
          playerId,
        },
      })
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-white"
        onClick={() => setIsOpen(true)}
      >
        Debug
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-auto shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex justify-between">
          <span>Debug Information</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsOpen(false)}>
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs">
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full" onClick={fetchDebugInfo} disabled={isLoading}>
            {isLoading ? "Loading..." : "Fetch Debug Info"}
          </Button>

          {debugInfo && (
            <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-[60vh]">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

