"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { useGameRealtime } from "@/lib/supabase-realtime-service"
import { supabaseClient } from "@/lib/supabase-client"

export default function JoinGamePage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>("retailer")
  const [gameCode, setGameCode] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [takenRoles, setTakenRoles] = useState<string[]>([])
  const [isJoining, setIsJoining] = useState(false)
  const [publicGames, setPublicGames] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [gameId, setGameId] = useState<string | null>(null)

  // Generate a temporary ID for this player
  const playerId = `temp-${Math.random().toString(36).substring(2, 9)}`

  // Initialize the game service with a temporary game ID
  const { sendEvent, lastEvent } = useGameRealtime("temp", playerId)

  // Load player name from localStorage if available
  useEffect(() => {
    const savedName = localStorage.getItem("playerName")
    if (savedName) {
      setPlayerName(savedName)
    }

    // Fetch public games
    fetchPublicGames()
  }, [])

  // Fetch public games from Supabase
  const fetchPublicGames = async () => {
    setIsLoading(true)
    try {
      const { data: games, error } = await supabaseClient
        .from("games")
        .select(`
          id, 
          code, 
          name, 
          status, 
          round, 
          total_rounds, 
          round_time,
          players (id, role)
        `)
        .eq("game_type", "public")
        .eq("status", "waiting")
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error

      setPublicGames(games || [])
    } catch (error) {
      console.error("Error fetching public games:", error)
      toast({
        title: "Error",
        description: "Failed to fetch public games. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle events from Supabase Realtime
  useEffect(() => {
    if (lastEvent) {
      if (lastEvent.type === "error" && lastEvent.payload.code === "ROLE_TAKEN") {
        setIsJoining(false)
        toast({
          title: "Role already taken",
          description: "This role is already taken. Please choose another role.",
          variant: "destructive",
        })
      } else if (lastEvent.type === "joinSuccess") {
        // Successfully joined, save info and redirect to lobby
        localStorage.setItem("playerName", playerName)
        localStorage.setItem("playerRole", selectedRole)

        // Use the gameId from the event payload
        const targetGameId = lastEvent.payload.gameId || selectedGame || gameId
        router.push(`/lobby?gameId=${targetGameId}`)
      }
    }
  }, [lastEvent, router, playerName, selectedRole, selectedGame, gameId])

  // Fetch taken roles for a specific game
  const fetchTakenRoles = async (gameId: string) => {
    try {
      const { data, error } = await supabaseClient.from("players").select("role").eq("game_id", gameId)

      if (error) throw error

      setTakenRoles(data.map((player) => player.role))
    } catch (error) {
      console.error("Error fetching taken roles:", error)
    }
  }

  // Handle game selection
  useEffect(() => {
    if (selectedGame) {
      fetchTakenRoles(selectedGame)
    }
  }, [selectedGame])

  // Handle game code input
  useEffect(() => {
    if (gameCode.length === 6) {
      fetchGameByCode(gameCode)
    } else {
      setTakenRoles([])
    }
  }, [gameCode])

  // Fetch game by code
  const fetchGameByCode = async (code: string) => {
    try {
      const { data, error } = await supabaseClient.from("games").select("id").eq("code", code).single()

      if (error) throw error

      if (data) {
        setGameId(data.id)
        fetchTakenRoles(data.id)
      }
    } catch (error) {
      console.error("Error fetching game by code:", error)
    }
  }

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to join the game.",
        variant: "destructive",
      })
      return
    }

    if ((!selectedGame && !gameCode) || !selectedRole) {
      toast({
        title: "Incomplete information",
        description: "Please select a game and role to join.",
        variant: "destructive",
      })
      return
    }

    setIsJoining(true)

    // Save player ID to localStorage
    localStorage.setItem("playerId", playerId)
    console.log("Saved player ID to localStorage:", playerId)

    // Send join request via Supabase Realtime
    console.log("Sending join request:", {
      name: playerName,
      role: selectedRole,
      gameCode: gameCode,
      gameId: selectedGame || gameId,
    })

    sendEvent("joinGame", {
      name: playerName,
      role: selectedRole,
      gameCode: gameCode,
      gameId: selectedGame || gameId,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-orange-700">Join a Game</CardTitle>
              <CardDescription>Find an existing game or enter a game code</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-6">
                <Label htmlFor="player-name">Your Name</Label>
                <Input
                  id="player-name"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  required
                />
              </div>
              <Tabs defaultValue="browse">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="browse">Browse Games</TabsTrigger>
                  <TabsTrigger value="code">Enter Game Code</TabsTrigger>
                </TabsList>

                <TabsContent value="browse" className="space-y-6">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading games...</p>
                    </div>
                  ) : publicGames.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No public games available. Try creating a new game!</p>
                      <Button variant="outline" className="mt-4" onClick={fetchPublicGames}>
                        Refresh
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {publicGames.map((game) => (
                        <div
                          key={game.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedGame === game.id ? "border-orange-500 bg-orange-50" : "hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedGame(game.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{game.name}</h3>
                              <p className="text-sm text-gray-500">Code: {game.code}</p>
                            </div>
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                              {game.players?.length || 0}/4 Players
                            </Badge>
                          </div>
                          <div className="mt-2 flex gap-4 text-xs text-gray-600">
                            <span>{game.total_rounds} Rounds</span>
                            <span>{game.round_time}s per Round</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedGame && (
                    <div className="border-t pt-6">
                      <h3 className="font-medium mb-3">Select Your Role</h3>
                      <RadioGroup
                        value={selectedRole}
                        onValueChange={setSelectedRole}
                        className="grid grid-cols-2 gap-2"
                      >
                        {["retailer", "wholesaler", "distributor", "manufacturer"].map((role) => {
                          const isTaken = takenRoles.includes(role)

                          return (
                            <div
                              key={role}
                              className="flex items-center space-x-2 border rounded-md p-3 hover:bg-orange-50"
                            >
                              <RadioGroupItem value={role} id={`join-${role}`} disabled={isTaken} />
                              <Label
                                htmlFor={`join-${role}`}
                                className={`cursor-pointer ${isTaken ? "text-gray-400" : ""}`}
                              >
                                {role.charAt(0).toUpperCase() + role.slice(1)} {isTaken ? "(Taken)" : ""}
                              </Label>
                            </div>
                          )
                        })}
                      </RadioGroup>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="code" className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="game-code">Game Code</Label>
                    <Input
                      id="game-code"
                      placeholder="Enter 6-digit code"
                      className="text-center text-lg tracking-widest"
                      value={gameCode}
                      onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                    <p className="text-xs text-gray-500 text-center mt-1">
                      The game code is provided by the game creator
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium mb-3">Select Your Role</h3>
                    <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="grid grid-cols-2 gap-2">
                      {["retailer", "wholesaler", "distributor", "manufacturer"].map((role) => {
                        const isTaken = takenRoles.includes(role)

                        return (
                          <div
                            key={role}
                            className="flex items-center space-x-2 border rounded-md p-3 hover:bg-orange-50"
                          >
                            <RadioGroupItem value={role} id={`code-${role}`} disabled={isTaken} />
                            <Label
                              htmlFor={`code-${role}`}
                              className={`cursor-pointer ${isTaken ? "text-gray-400" : ""}`}
                            >
                              {role.charAt(0).toUpperCase() + role.slice(1)} {isTaken ? "(Taken)" : ""}
                            </Label>
                          </div>
                        )
                      })}
                    </RadioGroup>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/">Cancel</Link>
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600"
                disabled={isJoining || (!selectedGame && !gameCode) || !playerName}
                onClick={handleJoinGame}
              >
                {isJoining ? "Joining..." : "Join Game"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

