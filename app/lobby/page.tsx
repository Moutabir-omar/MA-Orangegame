"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Clipboard, Copy, Users } from "lucide-react"
import { useGameRealtime } from "@/lib/supabase-realtime-service"
import { toast } from "@/components/ui/use-toast"
import { supabaseClient } from "@/lib/supabase-client"
import { DebugPanel } from "@/components/debug-panel"
import { Switch } from "@/components/ui/switch"

export type Player = {
  id: string
  name: string
  role: string
  connected: boolean
  inventory: number
  backlog: number
  orders: number[]
  costs: number[]
  is_ai?: boolean
}

export type GameState = {
  gameCode?: string
  round: number
  players: Player[]
  currentDemand: number
  takenRoles?: string[]
  scenarioActive?: {
    type: string
    description: string
    effect: string
    roundsRemaining: number
  }
}

export default function LobbyPage() {
  const [autoStartEnabled, setAutoStartEnabled] = useState(true)
  const [copied, setCopied] = useState(false)
  const [gameSettings, setGameSettings] = useState<any>(null)
  const [isHost, setIsHost] = useState(true)
  const [playerId, setPlayerId] = useState<string>("")
  const [isClientReady, setIsClientReady] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get gameId from URL
  const gameId = searchParams.get("gameId") || "unknown"

  // Set up playerId from localStorage - only runs on client side
  useEffect(() => {
    // Generate a player ID or get from localStorage
    const storedPlayerId = localStorage.getItem("playerId")
    const newPlayerId = storedPlayerId || `player-${Math.random().toString(36).substring(2, 9)}`
    
    // Save to state
    setPlayerId(newPlayerId)
    
    // Save to localStorage for future visits
    if (!storedPlayerId) {
      localStorage.setItem("playerId", newPlayerId)
    }
    
    // Mark client as ready
    setIsClientReady(true)
    
    // FORCE HOST STATUS
    console.log("FORCE SETTING HOST STATUS TO TRUE")
    setIsHost(true)
    localStorage.setItem(`creator_${gameId}`, "true")
  }, [gameId])

  // Initialize the game service - only after playerId is available
  const { isConnected, gameState, sendEvent, presenceState, lastEvent } = useGameRealtime(
    gameId, 
    playerId || `player-temp-${Math.random().toString(36).substring(2, 9)}`
  )

  // Fetch game settings
  useEffect(() => {
    const fetchGameSettings = async () => {
      try {
        const { data, error } = await supabaseClient.from("games").select("*").eq("id", gameId).single()

        if (error) throw error
        setGameSettings(data)
      } catch (error) {
        console.error("Error fetching game settings:", error)
        toast({
          title: "Error",
          description: "Failed to fetch game settings. Please try again.",
          variant: "destructive",
        })
      }
    }

    if (gameId !== "unknown") {
      fetchGameSettings()
    }
  }, [gameId])

  // Check if current player is host (first player to join)
  useEffect(() => {
    console.log("Host detection running", { 
      hasGameState: !!gameState,
      hasPlayers: !!gameState?.players?.length,
      playerId
    });
    
    if (gameState && gameState.players && gameState.players.length > 0 && playerId) {
      // The first player is considered the host
      const firstPlayer = gameState.players[0];
      const isCurrentPlayerHost = firstPlayer.id === playerId;
      
      console.log("Host check:", {
        firstPlayerId: firstPlayer.id,
        currentPlayerId: playerId,
        isHost: isCurrentPlayerHost,
        allPlayers: gameState.players.map(p => ({ id: p.id, name: p.name, role: p.role }))
      });
      
      // Don't override if already true
      if (!isHost) {
        setIsHost(isCurrentPlayerHost);
      }
      
      // Force host status if you created the game (backup method)
      if (gameSettings && gameSettings.created_by === playerId) {
        console.log("Setting host status because you created the game");
        setIsHost(true);
      }
    }
  }, [gameState, playerId, gameSettings, isHost]);

  // Add a fallback to detect if player created the game from URL
  useEffect(() => {
    const isCreator = localStorage.getItem(`creator_${gameId}`) === "true";
    if (isCreator) {
      console.log("Setting host status from localStorage creator flag");
      setIsHost(true);
    }
  }, [gameId]);

  // If this is a newly created game, mark the player as creator
  useEffect(() => {
    const referrer = document.referrer;
    if (referrer && referrer.includes("/create-game") && playerId) {
      console.log("Marking player as creator based on referrer");
      localStorage.setItem(`creator_${gameId}`, "true");
      setIsHost(true);
    }
  }, [gameId, playerId]);

  const copyGameCode = () => {
    if (gameState?.gameCode) {
      navigator.clipboard.writeText(gameState.gameCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const startGame = async () => {
    // Skip if no playerId is available yet
    if (!playerId) {
      console.error("Cannot start game: No player ID available");
      return;
    }
    
    try {
      // Prevent multiple starts
      if (isStarting) return;
      
      // Set starting flag to true to prevent multiple starts
      setIsStarting(true);
      
      console.log("Starting game...", { gameId, isHost, playerId });

      // Handle existing AI players if toggle is off
      if (!autoStartEnabled) {
        console.log("AI players disabled - removing any existing AI players");
        try {
          const { error: deleteError } = await supabaseClient
            .from("players")
            .delete()
            .eq("game_id", gameId)
            .eq("is_ai", true);
            
          if (deleteError) {
            console.error("Error removing AI players:", deleteError);
          }
        } catch (err) {
          console.error("Failed to remove AI players:", err);
        }
      }

      // Update game status to in_progress
      const { error } = await supabaseClient.from("games").update({ status: "in_progress" }).eq("id", gameId);

      if (error) {
        console.error("Error updating game status:", error);
        throw error;
      }

      console.log("Game status updated to in_progress");

      // Fill empty roles with AI players if needed
      const takenRoles = gameState?.takenRoles || [];
      const allRoles = ["retailer", "wholesaler", "distributor", "manufacturer"];
      const aiPlayersToCreate = [];

      // Only create AI players if autoStartEnabled is true
      if (autoStartEnabled) {
        console.log("Creating AI players for empty roles");
      for (const role of allRoles) {
        if (!takenRoles.includes(role)) {
          // Create AI player for this role
            console.log("Creating AI player for role:", role);
            aiPlayersToCreate.push({
            game_id: gameId,
            name: `AI ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            role: role,
            is_ai: true,
            inventory: 12,
            backlog: 0,
            });
          }
        }

        // Insert all AI players in one batch if needed
        if (aiPlayersToCreate.length > 0) {
          const { error: aiError } = await supabaseClient.from("players").insert(aiPlayersToCreate);
          if (aiError) {
            console.error(`Error creating AI players:`, aiError);
            // Continue even if AI players fail to create
          }
        }
      }

      // Create initial game round with proper data format
      console.log("Creating initial game round");
      try {
        const gameRoundData = {
        game_id: gameId,
        round: 1,
        demand: gameState?.currentDemand || 4,
        };
        
        console.log("Round data to insert:", gameRoundData);
        
        const { data: createdRound, error: roundError } = await supabaseClient
          .from("game_rounds")
          .insert(gameRoundData)
          .select();

        if (roundError) {
          console.error("Error creating initial game round:", roundError);
          // Continue even if round creation fails
        } else {
          console.log("Successfully created game round:", createdRound);
        }
      } catch (roundErr) {
        console.error("Exception when creating game round:", roundErr);
      }

      // Broadcast game start event
      console.log("Broadcasting game start event");
      sendEvent("gameStarted", {
        gameId: gameId,
      });

      // Directly redirect to game page without waiting for the event
      console.log("Redirecting to game page");
      router.push(`/game?gameId=${gameId}`);
    } catch (error) {
      // Reset starting flag
      setIsStarting(false);
      console.error("Error starting game:", error);
      toast({
        title: "Error",
        description: "Failed to start the game. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Listen for game started events
  useEffect(() => {
    if (lastEvent && lastEvent.type === "gameStarted") {
      console.log("Received gameStarted event, redirecting to game page", lastEvent);
      router.push(`/game?gameId=${gameId}`);
    }
  }, [lastEvent, router, gameId]);

  // Simple start function - directly starts the game without complex checks
  const forceStartGame = async () => {
    try {
      console.log("Force starting game...");
      
      // Update game status
      await supabaseClient.from("games").update({ status: "in_progress" }).eq("id", gameId);
      
      // Create initial game round
      await supabaseClient.from("game_rounds").insert({
        game_id: gameId,
        round: 1,
        demand: 4,
      });
      
      // Redirect to game page
      router.push(`/game?gameId=${gameId}`);
    } catch (error) {
      console.error("Error force starting game:", error);
    }
  };

  // Show a simple loading state while waiting for client-side initialization
  if (!isClientReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-orange-700 mb-4">Loading Game Lobby...</h2>
          <p className="text-gray-600">Please wait while we prepare your game.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Link href="/" className="inline-flex items-center text-orange-600 hover:text-orange-700">
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
              Leave Game
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Game Code:</span>
              <Badge variant="outline" className="bg-white font-mono text-lg px-3 py-1">
                {gameState?.gameCode || "Loading..."}
              </Badge>
              <Button variant="ghost" size="icon" onClick={copyGameCode} className="h-8 w-8">
                {copied ? <Clipboard className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Card className="shadow-lg mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl text-orange-700">Game Lobby</CardTitle>
                  <CardDescription>{gameSettings?.name || "Loading game..."}</CardDescription>
                </div>
                {isHost && (
                  <div className="flex flex-col items-end">
                    <Badge className="bg-orange-500 text-white text-lg px-4 py-2 mb-2">
                      Ready to Start
                    </Badge>
                    <p className="text-sm text-gray-600">Click Start Game when you're ready</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-lg mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-orange-600" />
                    Players ({gameState?.players.length || 0}/4)
                  </h3>

                  <div className="space-y-4">
                    {gameState?.players.map((player, index) => {
                      // Check if player is online using presence
                      const isOnline = Object.keys(presenceState).some(
                        (key) => key === player.id && presenceState[key].length > 0,
                      )

                      return (
                        <div
                          key={player.id}
                          className={`flex items-center gap-4 p-3 rounded-lg ${
                            player.id === playerId ? "bg-orange-50" : "border"
                          }`}
                        >
                          <Avatar>
                            <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Avatar" />
                            <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center">
                              {player.name} {player.id === playerId ? "(You)" : ""}
                              {player.is_ai && <Badge className="ml-2 bg-blue-100 text-blue-800">AI</Badge>}
                              <div
                                className={`w-2 h-2 rounded-full ml-2 ${isOnline ? "bg-green-500" : "bg-gray-300"}`}
                              ></div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {player.role.charAt(0).toUpperCase() + player.role.slice(1)}
                            </div>
                          </div>
                          {index === 0 && <Badge className="ml-auto">Host</Badge>}
                        </div>
                      )
                    })}

                    {/* Empty slots */}
                    {gameState &&
                      Array.from({ length: Math.max(0, 4 - (gameState.players.length || 0)) }).map((_, i) => {
                        // Get available roles that aren't taken
                        const availableRoles = ["retailer", "wholesaler", "distributor", "manufacturer"].filter(
                          (role) => !gameState.takenRoles?.includes(role),
                        )

                        // Get a different role for each empty slot
                        const roleForThisSlot = availableRoles[i % availableRoles.length]

                        return (
                          <div
                            key={`empty-${i}`}
                            className="flex items-center gap-4 p-3 rounded-lg border border-dashed"
                          >
                            <Avatar>
                              <AvatarFallback className="bg-gray-100 text-gray-400">AI</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-400">Waiting for player...</div>
                              <div className="text-sm text-gray-400">
                                <span className="capitalize">{roleForThisSlot}</span>
                                <span className="ml-1">(AI will fill if empty)</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-lg mb-4">Game Settings</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Game Type:</span>
                      <span>{gameSettings?.game_type === "public" ? "Public" : "Private"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Rounds:</span>
                      <span>{gameSettings?.total_rounds || 50}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Round Time:</span>
                      <span>{gameSettings?.round_time || 45} seconds</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inventory Cost:</span>
                      <span>5 MAD per case per round</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Backorder Cost:</span>
                      <span>10 MAD per case per round</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Initial Inventory:</span>
                      <span>12 cases</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Delay:</span>
                      <span>2 rounds</span>
                    </div>
                    <Separator className="my-3" />
                    {isHost && (
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Fill empty roles with AI players:</span>
                          <Switch 
                            checked={autoStartEnabled}
                            onCheckedChange={setAutoStartEnabled}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {autoStartEnabled 
                            ? "When game starts, AI players will automatically fill any empty roles" 
                            : "When game starts, empty roles will remain unfilled for friends to join later"}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">AI Difficulty:</span>
                      <span>{gameSettings?.ai_difficulty || "Adaptive"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Game Rules",
                    description:
                      "The Orange Juice Game simulates a supply chain with 4 roles. Each player manages inventory, fulfills orders, and places new orders each round. The goal is to minimize total costs (inventory at 5 MAD/case and backlog at 10 MAD/case) over 50 rounds.",
                    duration: 10000,
                  })
                }}
              >
                Game Rules
              </Button>
              {isHost && (
              <Button
                className="bg-orange-500 hover:bg-orange-600"
                  disabled={isStarting}
                onClick={startGame}
              >
                  {isStarting 
                    ? "Starting Game..." 
                    : "Start Game Now"}
              </Button>
              )}
            </CardFooter>
          </Card>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-orange-700 mb-4">Game Overview</h2>
            <p className="mb-4">
              In the Orange Juice Distribution Game, you'll experience the challenges of managing a supply chain. Each
              player takes on a specific role, from Retailer to Manufacturer, and must make decisions about ordering and
              inventory management.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-medium mb-2">Round Structure:</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>Check deliveries from your supplier</li>
                  <li>Fulfill orders from your customer</li>
                  <li>Update inventory and backlog</li>
                  <li>Place new orders to your supplier</li>
                  <li>Calculate costs for the round</li>
                </ol>
              </div>
              <div>
                <h3 className="font-medium mb-2">Tips for Success:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Monitor your inventory levels carefully</li>
                  <li>Anticipate future demand patterns</li>
                  <li>Communicate with your team when possible</li>
                  <li>Balance holding costs against stockout risks</li>
                  <li>Learn from each round to improve your strategy</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Debug host status control - only shown in current session */}
          <div className="mb-4 p-4 bg-gray-100 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-bold">Host Status: {isHost ? "You are host" : "Not host"}</p>
              <p className="text-sm text-gray-600">Player ID: {playerId}</p>
            </div>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsHost(true)}
                className="bg-green-100"
              >
                Make Me Host
              </Button>
              <Button 
                variant="outline"
                onClick={forceStartGame}
                className="bg-blue-100"
              >
                Force Start Game
              </Button>
            </div>
          </div>
        </div>
        <DebugPanel gameId={gameId} playerId={playerId} />
      </div>
    </div>
  )
}

