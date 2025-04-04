"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { AIDifficultySelector, type AIDifficulty } from "@/components/ai-difficulty-selector"
import { useGameRealtime } from "@/lib/supabase-realtime-service"
import { toast } from "@/components/ui/use-toast"

export default function CreateGamePage() {
  const [gameName, setGameName] = useState("My Supply Chain Game")
  const [gameType, setGameType] = useState("public")
  const [roundTime, setRoundTime] = useState(45)
  const [totalRounds, setTotalRounds] = useState(50)
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>("adaptive")
  const [enableScenarios, setEnableScenarios] = useState(true)
  const [selectedRole, setSelectedRole] = useState("retailer")
  const [playerName, setPlayerName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  // Generate a temporary ID for this player - use a ref to avoid regenerating on each render
  const playerIdRef = useRef(`temp-${Math.random().toString(36).substring(2, 9)}`)

  // Initialize the game service with a temporary game ID - use a stable reference
  const { createGame, sendEvent } = useGameRealtime("temp", playerIdRef.current)

  // Load player name from localStorage if available - only run once on mount
  useEffect(() => {
    const savedName = localStorage.getItem("playerName")
    if (savedName) {
      setPlayerName(savedName)
    }
  }, [])

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to create the game.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      // Create the game in Supabase
      const game = await createGame({
        name: gameName,
        totalRounds,
        roundTime,
        gameType,
        aiDifficulty,
        enableScenarios,
      })

      if (!game) {
        throw new Error("Failed to create game")
      }

      // Save player name to localStorage
      localStorage.setItem("playerName", playerName)
      localStorage.setItem("playerRole", selectedRole)
      localStorage.setItem("playerId", playerIdRef.current)

      // Join the game as the selected role
      sendEvent("joinGame", {
        name: playerName,
        role: selectedRole,
        gameId: game.id,
      })

      // Redirect to the lobby
      router.push(`/lobby?gameId=${game.id}`)
    } catch (error) {
      console.error("Error creating game:", error)
      toast({
        title: "Error",
        description: "Failed to create game. Please try again.",
        variant: "destructive",
      })
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
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
              <CardTitle className="text-2xl text-orange-700">Create New Game</CardTitle>
              <CardDescription>Configure your Orange Juice Distribution Game session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="player-name">Your Name</Label>
                <Input
                  id="player-name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="game-name">Game Name</Label>
                <Input
                  id="game-name"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="My Supply Chain Game"
                />
              </div>

              <div className="space-y-2">
                <Label>Game Type</Label>
                <RadioGroup value={gameType} onValueChange={setGameType} className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public" className="cursor-pointer">
                      Public Game (Anyone can join)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private" className="cursor-pointer">
                      Private Game (Invitation only)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Round Time (seconds)</Label>
                <div className="pt-2">
                  <Slider
                    value={[roundTime]}
                    min={15}
                    max={120}
                    step={5}
                    onValueChange={(value) => setRoundTime(value[0])}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>15s</span>
                    <span>{roundTime}s</span>
                    <span>120s</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Total Rounds</Label>
                <div className="pt-2">
                  <Slider
                    value={[totalRounds]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={(value) => setTotalRounds(value[0])}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10</span>
                    <span>{totalRounds}</span>
                    <span>100</span>
                  </div>
                </div>
              </div>

              <AIDifficultySelector value={aiDifficulty} onChange={setAiDifficulty} />

              <div className="space-y-4">
                <Label>Game Features</Label>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Fill Empty Roles with AI</h4>
                    <p className="text-xs text-gray-500">AI will play any unfilled roles</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Enable Scenario Challenges</h4>
                    <p className="text-xs text-gray-500">Random events like demand spikes and supply disruptions</p>
                  </div>
                  <Switch checked={enableScenarios} onCheckedChange={setEnableScenarios} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Decision Impact Analysis</h4>
                    <p className="text-xs text-gray-500">Show how your decisions affect performance metrics</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Excel Export</h4>
                    <p className="text-xs text-gray-500">Enable detailed game data export to Excel</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your Role Preference</Label>
                <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-orange-50">
                    <RadioGroupItem value="retailer" id="retailer" />
                    <Label htmlFor="retailer" className="cursor-pointer">
                      Retailer
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-orange-50">
                    <RadioGroupItem value="wholesaler" id="wholesaler" />
                    <Label htmlFor="wholesaler" className="cursor-pointer">
                      Wholesaler
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-orange-50">
                    <RadioGroupItem value="distributor" id="distributor" />
                    <Label htmlFor="distributor" className="cursor-pointer">
                      Distributor
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-orange-50">
                    <RadioGroupItem value="manufacturer" id="manufacturer" />
                    <Label htmlFor="manufacturer" className="cursor-pointer">
                      Manufacturer
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/">Cancel</Link>
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600"
                onClick={handleCreateGame}
                disabled={isCreating || !playerName.trim()}
              >
                {isCreating ? "Creating..." : "Create Game"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

