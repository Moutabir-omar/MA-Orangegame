"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDown, Clock, HelpCircle, Info, Truck, Package, Warehouse, AlertTriangle, Download } from "lucide-react"
import { GameChart } from "@/components/game-chart"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScenarioAlert } from "@/components/scenario-alert"
import { DecisionImpact } from "@/components/decision-impact"
import { useGameRealtime } from "@/lib/supabase-realtime-service"
import { downloadExcelFile } from "@/lib/excel-export"
import { toast } from "@/components/ui/use-toast"
import { supabaseClient } from "@/lib/supabase-client"
import { ReconnectionHandler } from "@/components/reconnection-handler"

// Define types for game data export
interface PlayerStats {
  round: number;
  role: string;
  inventory: number;
  backlog: number;
  incomingOrder: number;
  outgoingOrder: number;
  incomingShipment: number;
  roundCost: number;
  cumulativeCost: number;
  timestamp: string;
}

interface GameExportData {
  gameId: string;
  startTime: string;
  endTime: string;
  totalRounds: number;
  players: Array<{
    role: string;
    name: string;
    totalCost: number;
    averageInventory: number;
    averageBacklog: number;
    serviceLevel: number;
  }>;
  rounds: Array<{
    round: number;
    demand: number;
    scenario?: string;
  }>;
  playerStats: PlayerStats[];
  playerActions: Array<{
    round: number;
    role: string;
    action: string;
    value: number;
    timestamp: number;
  }>;
}

// Player type for the gameState
interface Player {
  id: string;
  name: string;
  role: string;
  connected: boolean;
  inventory: number;
  backlog: number;
  orders: number[];
  costs: number[];
  roundCost?: number;
  cumulativeCost?: number;
  incomingShipment?: number;
  is_ai?: boolean;
}

export default function GamePage() {
  // Game state
  const [currentRound, setCurrentRound] = useState(1)
  const [timeLeft, setTimeLeft] = useState(45)
  const [inventory, setInventory] = useState(12)
  const [backlog, setBacklog] = useState(0)
  const [incomingOrder, setIncomingOrder] = useState(4)
  const [incomingShipment, setIncomingShipment] = useState(0)
  const [orderAmount, setOrderAmount] = useState("")
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [cumulativeCost, setCumulativeCost] = useState(0)
  const [roundCost, setRoundCost] = useState(0)
  const [demandHistory, setDemandHistory] = useState([4])
  const [orderHistory, setOrderHistory] = useState<number[]>([])
  const [inventoryHistory, setInventoryHistory] = useState([12])
  const [backlogHistory, setBacklogHistory] = useState([0])
  const [costHistory, setCostHistory] = useState([0])
  const [showHelp, setShowHelp] = useState(false)
  const [activeRole, setActiveRole] = useState("retailer")
  const [playerData, setPlayerData] = useState<any>(null)
  const [gameData, setGameData] = useState<any>(null)
  const [playerStats, setPlayerStats] = useState<any[]>([])

  // Use refs to avoid dependency issues
  const gameDataRef = useRef<any>(null)
  const playerDataRef = useRef<any>(null)
  const currentRoundRef = useRef(1)

  // Scenario state
  const [activeScenario, setActiveScenario] = useState<{
    type: string
    description: string
    effect: string
    roundsRemaining: number
  } | null>(null)

  // Get gameId from URL
  const searchParams = useSearchParams()
  const gameId = searchParams.get("gameId") || "unknown"

  // Get player info from localStorage
  const playerId = localStorage.getItem("playerId") || `player-${Math.random().toString(36).substring(2, 9)}`
  const playerRole = localStorage.getItem("playerRole") || "retailer"

  // Initialize the game service
  const { isConnected, gameState, lastEvent, sendEvent, getPlayerActionsForExport, reconnect } = useGameRealtime(
    gameId,
    playerId,
  )

  // Define cost thresholds for warnings
  const COST_WARNING_THRESHOLD = 100 // 100 MAD
  const COST_DANGER_THRESHOLD = 200 // 200 MAD
  const BACKLOG_WARNING_THRESHOLD = 3
  const BACKLOG_DANGER_THRESHOLD = 6

  // Memoize the fetchPlayerData function
  const fetchPlayerData = useCallback(async () => {
    if (!gameId || gameId === "unknown") return

    try {
      // Find player by role
      const { data, error } = await supabaseClient
        .from("players")
        .select("*")
        .eq("game_id", gameId)
        .eq("role", playerRole)
        .single()

      if (error) throw error
      setPlayerData(data)
      playerDataRef.current = data
      setActiveRole(data.role)
    } catch (error) {
      console.error("Error fetching player data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch player data. Please try again.",
        variant: "destructive",
      })
    }
  }, [gameId, playerRole])

  // Memoize the fetchGameData function
  const fetchGameData = useCallback(async () => {
    if (!gameId || gameId === "unknown") return

    try {
      const { data, error } = await supabaseClient.from("games").select("*").eq("id", gameId).single()

      if (error) throw error
      setGameData(data)
      gameDataRef.current = data
      setCurrentRound(data.round)
      currentRoundRef.current = data.round
      setIncomingOrder(data.current_demand)

      // Only update demand history if it's a new value
      setDemandHistory((prev) => {
        if (prev[prev.length - 1] !== data.current_demand) {
          return [...prev, data.current_demand]
        }
        return prev
      })

      if (data.scenario_active) {
        setActiveScenario(data.scenario_active)
      }
    } catch (error) {
      console.error("Error fetching game data:", error)
    }
  }, [gameId])

  // Memoize the fetchPlayerStats function
  const fetchPlayerStats = useCallback(async () => {
    if (!gameId || gameId === "unknown" || !playerDataRef.current) return

    try {
      console.log("Fetching player stats for round:", currentRoundRef.current);
      
      // Get player stats
      const { data, error } = await supabaseClient
        .from("player_stats")
        .select("*")
        .eq("game_id", gameId)
        .eq("player_id", playerDataRef.current.id)
        .order("round", { ascending: true })

      if (error) throw error

      setPlayerStats(data || [])

      // Update state with the latest stats
      if (data && data.length > 0) {
        console.log("Player stats data retrieved:", data);
        
        const latestStats = data[data.length - 1]
        setInventory(latestStats.inventory)
        setBacklog(latestStats.backlog)
        setRoundCost(Number(latestStats.round_cost || 0))
        setCumulativeCost(Number(latestStats.cumulative_cost || 0))
        
        // Check for incoming shipment from 2 rounds ago
        if (currentRoundRef.current > 2) {
          const previousRoundStats = data.find(stat => stat.round === currentRoundRef.current - 2);
          if (previousRoundStats) {
            console.log("Found previous round stats for shipment:", previousRoundStats);
            setIncomingShipment(previousRoundStats.outgoing_order || 0);
          } else {
            setIncomingShipment(latestStats.incoming_shipment || 0);
          }
        } else {
          setIncomingShipment(latestStats.incoming_shipment || 0);
        }

        // Build history arrays
        const invHistory = data.map((stat) => stat.inventory)
        const blHistory = data.map((stat) => stat.backlog)
        const costHist = data.map((stat) => Number(stat.round_cost || 0))

        setInventoryHistory([12, ...invHistory])
        setBacklogHistory([0, ...blHistory])
        setCostHistory([0, ...costHist])

        // Get order history
        const { data: actions, error: actionsError } = await supabaseClient
          .from("player_actions")
          .select("*")
          .eq("game_id", gameId)
          .eq("player_id", playerDataRef.current.id)
          .eq("action", "placeOrder")
          .order("round", { ascending: true })

        if (actionsError) throw actionsError

        if (actions) {
          console.log("Player actions retrieved:", actions);
          setOrderHistory(actions.map((action) => action.value))

          // Check if player has already placed an order for the current round
          const currentRoundOrder = actions.find((action) => action.round === currentRoundRef.current)
          if (currentRoundOrder) {
            setOrderPlaced(true)
            setOrderAmount(currentRoundOrder.value.toString())
          } else {
            setOrderPlaced(false)
            setOrderAmount("")
          }
        }
      }
    } catch (error) {
      console.error("Error fetching player stats:", error)
      toast({
        title: "Error",
        description: "Failed to fetch player stats. Please try again.",
        variant: "destructive",
      })
    }
  }, [gameId])

  // Fetch data when component mounts
  useEffect(() => {
    console.log("Game state:", gameState)
    console.log("Is connected:", isConnected)
    console.log("Player data:", playerData)
    console.log("Game data:", gameData)
  }, [gameState, isConnected, playerData, gameData])

  useEffect(() => {
    if (gameId !== "unknown") {
      fetchPlayerData()
      fetchGameData()
    }
  }, [gameId, fetchPlayerData, fetchGameData])

  // Fetch player stats when player data is available
  useEffect(() => {
    if (playerData) {
      fetchPlayerStats()
    }
  }, [playerData, fetchPlayerStats])

  // Calculate incoming shipment based on previous orders
  const calculateIncomingShipment = useCallback(() => {
    if (playerStats.length > 0 && currentRound > 2) {
      // Find the player stats from 2 rounds ago
      const previousStats = playerStats.find((stat) => stat.round === currentRound - 2)
      if (previousStats) {
        setIncomingShipment(previousStats.outgoing_order)
      }
    }
  }, [playerStats, currentRound])

  // Calculate real-time costs for displaying in UI
  const calculateCurrentCosts = useCallback(() => {
    // Inventory cost: 5 MAD per case
    const inventoryCost = inventory * 5;
    
    // Backlog cost: 10 MAD per case (penalty for unfulfilled orders)
    const backlogCost = backlog * 10;
    
    // Total round cost is the sum of inventory and backlog costs
    const calculatedRoundCost = inventoryCost + backlogCost;
    
    // Update the round cost if it's different from current value
    if (calculatedRoundCost !== roundCost) {
      setRoundCost(calculatedRoundCost);
    }
    
    // Calculate cumulative cost
    let calculatedCumulativeCost = costHistory.reduce((sum, cost) => sum + cost, 0) + calculatedRoundCost;
    if (calculatedCumulativeCost !== cumulativeCost) {
      setCumulativeCost(calculatedCumulativeCost);
    }
    
    console.log("Cost calculation:", {
      inventory,
      inventoryCost,
      backlog,
      backlogCost,
      calculatedRoundCost,
      calculatedCumulativeCost
    });
  }, [inventory, backlog, roundCost, cumulativeCost, costHistory]);

  // Call functions when needed
  useEffect(() => {
    calculateIncomingShipment();
    calculateCurrentCosts();
  }, [calculateIncomingShipment, calculateCurrentCosts, inventory, backlog]);

  // Add an additional check to update incoming shipment when gameState updates
  useEffect(() => {
    if (gameState && gameState.players) {
      const currentPlayer = gameState.players.find((p) => p.role === playerRole);
      if (currentPlayer) {
        const playerWithExtendedData = currentPlayer as unknown as Player;
        if (playerWithExtendedData.incomingShipment !== undefined) {
          setIncomingShipment(playerWithExtendedData.incomingShipment)
        }
      }
    }
  }, [gameState, playerRole]);

  // Calculate outgoing transport: this is the amount being shipped to customers
  const calculateOutgoingTransport = useCallback(() => {
    // Outgoing amount is limited by what we have in inventory to fulfill customer orders
    // First try to fulfill any existing backlog, then handle new incoming orders
    const totalDemand = backlog + incomingOrder;
    const outgoingAmount = Math.min(inventory, totalDemand);
    
    return outgoingAmount;
  }, [inventory, backlog, incomingOrder]);

  // Get actual outgoing amount for display
  const actualOutgoingAmount = useMemo(() => {
    return calculateOutgoingTransport();
  }, [calculateOutgoingTransport]);

  // Determine what will be displayed as "outgoing transport"
  const outgoingTransport = useMemo(() => {
    // If order is placed, show what the user ordered
    if (orderPlaced) {
      return Number.parseInt(orderAmount) || 0;
    }
    // Otherwise show 0
    return 0;
  }, [orderPlaced, orderAmount]);

  // Simulate countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (currentRound < (gameDataRef.current?.total_rounds || 50)) {
      // Auto-advance to next round if time runs out
      advanceToNextRound()
    }
  }, [timeLeft, currentRound])

  const placeOrder = useCallback(async () => {
    if (!orderAmount || orderPlaced || !playerData) return

    try {
      setOrderPlaced(true)
      const orderValue = Number.parseInt(orderAmount)

      // Update local state
      setOrderHistory((prev) => [...prev, orderValue])

      // Send order to server
      sendEvent("placeOrder", {
        role: playerRole,
        amount: orderValue,
        round: currentRound,
      })

      // Also insert directly into the database as a backup
      const { error } = await supabaseClient.from("player_actions").insert({
        game_id: gameId,
        player_id: playerData.id,
        round: currentRound,
        action: "placeOrder",
        value: orderValue,
      })

      if (error) {
        console.error("Error inserting player action:", error)
        // Don't throw here, just log the error
      }

      console.log("Placing order:", {
        gameId,
        playerId: playerData?.id,
        round: currentRound,
        action: "placeOrder",
        value: Number.parseInt(orderAmount),
      })

      // Show success toast
      toast({
        title: "Order placed",
        description: `You ordered ${orderValue} cases.`,
      })
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      })
      setOrderPlaced(false)
    }
  }, [orderAmount, orderPlaced, playerData, playerRole, currentRound, gameId, sendEvent])

  const advanceToNextRound = useCallback(async () => {
    if (!orderPlaced) {
      toast({
        title: "Place order first",
        description: "You need to place an order before advancing to the next round.",
        variant: "destructive",
      })
      return
    }

    try {
      // Notify server to advance round
      sendEvent("advanceRound", {
        gameId,
        currentRound,
      })

      // Reset UI state
      setTimeLeft(gameDataRef.current?.round_time || 45)
    } catch (error) {
      console.error("Failed to advance round:", error);
      toast({
        title: "Error",
        description: "Failed to advance round. Please try again.",
        variant: "destructive",
      });
    }
  }, [orderPlaced, gameId, currentRound, sendEvent])

  // Export game data to Excel
  const exportToExcel = useCallback(async () => {
    try {
      // Get all players
      const { data: players, error: playersError } = await supabaseClient
        .from("players")
        .select("id, name, role")
        .eq("game_id", gameId)

      if (playersError) throw playersError

      // Get all rounds
      const { data: rounds, error: roundsError } = await supabaseClient
        .from("game_rounds")
        .select("round, demand, scenario")
        .eq("game_id", gameId)
        .order("round", { ascending: true })

      if (roundsError) throw roundsError

      // Get all player stats
      const { data: stats, error: statsError } = await supabaseClient
        .from("player_stats")
        .select("*")
        .eq("game_id", gameId)
        .order("round", { ascending: true })

      if (statsError) throw statsError

      // Get all player actions
      const { data: actions, error: actionsError } = await supabaseClient
        .from("player_actions")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true })

      if (actionsError) throw actionsError

      console.log("Export data:", { players, rounds, stats, actions });

      // Prepare data for export with correct typing
      const exportedRounds = rounds.map((round) => ({
        round: round.round,
        demand: round.demand,
        scenario: round.scenario === null ? undefined : round.scenario,
      }));

      // Process player stats to ensure all data is formatted correctly
      const formattedPlayerStats = stats.map((stat) => {
        const role = players.find((p) => p.id === stat.player_id)?.role || "";
        return {
          round: stat.round,
          role: role,
          inventory: Number(stat.inventory || 0),
          backlog: Number(stat.backlog || 0),
          incomingOrder: Number(stat.incoming_order || 0),
          outgoingOrder: Number(stat.outgoing_order || 0),
          incomingShipment: Number(stat.incoming_shipment || 0),
          roundCost: Number(stat.round_cost || 0),
          cumulativeCost: Number(stat.cumulative_cost || 0),
          timestamp: stat.created_at || new Date().toISOString(),
        };
      });

      // Process player actions to ensure all data is formatted correctly
      const formattedPlayerActions = actions.map((action) => {
        return {
          round: action.round,
          role: players.find((p) => p.id === action.player_id)?.role || "",
          action: action.action,
          value: Number(action.value || 0),
          timestamp: new Date(action.created_at).getTime(),
        };
      });

      // Add missing rounds data if needed
      const maxRound = Math.max(...stats.map(s => s.round), 0);
      for (let i = 1; i <= maxRound; i++) {
        if (!exportedRounds.find(r => r.round === i)) {
          exportedRounds.push({
            round: i,
            demand: 0,
            scenario: undefined
          });
        }
      }
      
      // Sort rounds by round number
      exportedRounds.sort((a, b) => a.round - b.round);

      const gameDataValue: GameExportData = {
        gameId,
        startTime: gameDataRef.current?.created_at || new Date().toISOString(),
        endTime: new Date().toISOString(),
        totalRounds: gameDataRef.current?.total_rounds || maxRound || 50,
        players: players.map((player) => {
          const playerStats = stats.filter((stat) => stat.player_id === player.id);
          const totalCost = playerStats.reduce((sum, stat) => sum + Number(stat.round_cost || 0), 0);
          const inventorySum = playerStats.reduce((sum, stat) => sum + Number(stat.inventory || 0), 0);
          const backlogSum = playerStats.reduce((sum, stat) => sum + Number(stat.backlog || 0), 0);
          const backlogCount = playerStats.filter((stat) => Number(stat.backlog || 0) > 0).length;
          
          return {
            role: player.role,
            name: player.name,
            totalCost: totalCost,
            averageInventory: playerStats.length ? inventorySum / playerStats.length : 0,
            averageBacklog: playerStats.length ? backlogSum / playerStats.length : 0,
            serviceLevel: playerStats.length ? Math.round((1 - backlogCount / playerStats.length) * 100) : 100,
          };
        }),
        rounds: exportedRounds,
        playerStats: formattedPlayerStats,
        playerActions: formattedPlayerActions,
      };

      console.log("Excel export data:", gameDataValue);
      
      // Download the Excel file
      downloadExcelFile(gameDataValue, `orange-juice-game-results-${gameId}.xlsx`);
      
      toast({
        title: "Export Complete",
        description: "Game data has been exported to Excel successfully.",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export Error",
        description: "Failed to export game data. Please try again.",
        variant: "destructive",
      });
    }
  }, [gameId]);

  // Calculate percentage of inventory filled
  const inventoryPercentage = Math.min(100, (inventory / 20) * 100)
  const backlogPercentage = Math.min(100, (backlog / 10) * 100)

  // Determine cost status for visual indicators
  const getCostStatus = (cost: number) => {
    if (cost >= COST_DANGER_THRESHOLD) return "danger"
    if (cost >= COST_WARNING_THRESHOLD) return "warning"
    return "normal"
  }

  // Determine backlog status for visual indicators
  const getBacklogStatus = (backlogAmount: number) => {
    if (backlogAmount >= BACKLOG_DANGER_THRESHOLD) return "danger"
    if (backlogAmount >= BACKLOG_WARNING_THRESHOLD) return "warning"
    if (backlogAmount > 0) return "active"
    return "none"
  }

  const costStatus = getCostStatus(roundCost)
  const backlogStatus = getBacklogStatus(backlog)

  // Calculate average order and demand for decision impact analysis
  const averageOrder =
    orderHistory.length > 0 ? orderHistory.reduce((sum, order) => sum + order, 0) / orderHistory.length : 0

  const averageDemand =
    demandHistory.length > 0 ? demandHistory.reduce((sum, demand) => sum + demand, 0) / demandHistory.length : 4

  // Analyze decision impact
  const decisionImpact = useMemo(() => {
    const orderValue = Number.parseInt(orderAmount) || 0

    // Analyze inventory impact
    let inventoryImpact: "increase" | "decrease" | "stable" = "stable"
    if (orderValue > averageDemand * 1.2) {
      inventoryImpact = "increase"
    } else if (orderValue < averageDemand * 0.8) {
      inventoryImpact = "decrease"
    }

    // Analyze cost impact
    let costImpact: "increase" | "decrease" | "stable" = "stable"
    if (orderValue > averageDemand * 1.3 && inventory > 10) {
      costImpact = "increase" // Higher inventory costs
    } else if (orderValue < averageDemand * 0.7 && inventory < 5) {
      costImpact = "increase" // Higher backlog costs
    } else if (orderValue >= averageDemand * 0.8 && orderValue <= averageDemand * 1.2) {
      costImpact = "decrease"
    }

    // Analyze service level impact
    let serviceImpact: "increase" | "decrease" | "stable" = "stable"
    if (orderValue > averageDemand * 1.1 || (inventory > 10 && orderValue >= averageDemand)) {
      serviceImpact = "increase"
    } else if (orderValue < averageDemand * 0.9 && inventory < 5) {
      serviceImpact = "decrease"
    }

    // Analyze bullwhip effect impact
    let bullwhipImpact: "increase" | "decrease" | "stable" = "stable"
    if (orderValue > averageDemand * 1.3 || orderValue < averageDemand * 0.7) {
      bullwhipImpact = "increase"
    } else if (orderValue >= averageDemand * 0.9 && orderValue <= averageDemand * 1.1) {
      bullwhipImpact = "decrease"
    }

    return {
      inventoryImpact,
      costImpact,
      serviceImpact,
      bullwhipImpact,
    }
  }, [orderAmount, averageDemand, inventory])

  // Get player data for a specific role
  const getPlayerData = useCallback(
    (role: string) => {
      if (!gameState || !gameState.players) return null
      return gameState.players.find((p) => p.role === role)
    },
    [gameState],
  )

  const handleSupabaseError = (error: any, message: string) => {
    console.error(`${message}:`, error)
    toast({
      title: "Error",
      description: `${message}. Please try again.`,
      variant: "destructive",
    })
  }

  // Update game state from Supabase Realtime
  useEffect(() => {
    if (gameState) {
      // Debug logs to see what's happening with game state
      console.log("Current game state updated:", {
        inventory,
        backlog,
        roundCost,
        cumulativeCost,
        incomingShipment,
        currentRound,
        isConnected
      });

      // Only update if the round has changed
      if (gameState.round !== currentRound) {
        setCurrentRound(gameState.round)
        currentRoundRef.current = gameState.round

        // Reset timer when round changes
        setTimeLeft(gameDataRef.current?.round_time || 45)

        // Reset order placed status
        setOrderPlaced(false)
        setOrderAmount("")
        
        // Refresh player stats when round changes
        fetchPlayerStats()
      }

      // Update scenario
      if (gameState.scenarioActive) {
        setActiveScenario(gameState.scenarioActive)
      } else {
        setActiveScenario(null)
      }

      // Update current demand if it's changed
      if (gameState.currentDemand !== incomingOrder) {
        setIncomingOrder(gameState.currentDemand)
        setDemandHistory((prev) => {
          // Avoid duplicate entries
          if (prev[prev.length - 1] !== gameState.currentDemand) {
            return [...prev, gameState.currentDemand]
          }
          return prev
        })
      }

      // Update player data
      const currentPlayer = gameState.players.find((p) => p.role === playerRole);
      if (currentPlayer) {
        if (currentPlayer.inventory !== inventory) {
          setInventory(currentPlayer.inventory)
        }

        if (currentPlayer.backlog !== backlog) {
          setBacklog(currentPlayer.backlog)
          
          // Recalculate costs when backlog changes
          calculateCurrentCosts();
        }
        
        // Check if the player data has roundCost and cumulativeCost
        const playerWithExtendedData = currentPlayer as unknown as Player;
        
        if (playerWithExtendedData.roundCost !== undefined) {
          setRoundCost(Number(playerWithExtendedData.roundCost))
        }
        
        if (playerWithExtendedData.cumulativeCost !== undefined) {
          setCumulativeCost(Number(playerWithExtendedData.cumulativeCost))
        }

        if (currentPlayer.orders && currentPlayer.orders.length > orderHistory.length) {
          setOrderHistory(currentPlayer.orders)
        }
        
        if (playerWithExtendedData.incomingShipment !== undefined) {
          setIncomingShipment(playerWithExtendedData.incomingShipment)
        }
      }
    }
  }, [gameState, playerRole, currentRound, incomingOrder, inventory, backlog, orderHistory.length, fetchPlayerStats, roundCost, cumulativeCost, incomingShipment, isConnected, calculateCurrentCosts]);

  // Process player actions from other players
  useEffect(() => {
    if (lastEvent && lastEvent.type === "playerAction") {
      // Handle actions from other players
      console.log("Player action received:", lastEvent.payload)

      // If this is a new round notification, refresh player stats
      if (lastEvent.payload.action === "newRound") {
        fetchPlayerStats()
        fetchGameData()
      }
    }
  }, [lastEvent, fetchPlayerStats, fetchGameData])

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-ensa-berrechid-ZO3gTc1tJ1YAHtnNNIGnLQxEk3lpQG.png"
                alt="ENSA Berrechid Logo"
                className="h-10"
              />
              <div>
                <h1 className="text-xl font-bold text-orange-700">Orange Juice Game</h1>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  Round {currentRound}/{gameData?.total_rounds || 50}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-500">Time Left</div>
                <div className="font-bold text-lg flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-orange-600" />
                  {timeLeft}s
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-500">Total Cost</div>
                <div className="font-bold text-lg">{cumulativeCost.toFixed(2)} MAD</div>
              </div>

              <Button variant="outline" size="sm" className="gap-1" onClick={exportToExcel}>
                <Download className="h-4 w-4" />
                Export
              </Button>

              <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowHelp(!showHelp)}>
                <HelpCircle className="h-4 w-4" />
                Help
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <Tabs defaultValue={playerRole} value={activeRole} onValueChange={setActiveRole} className="mb-6">
          <TabsList className="grid grid-cols-4 w-full">
            {["retailer", "wholesaler", "distributor", "manufacturer"].map((role) => {
              const player = gameState && gameState.players ? gameState.players.find((p) => p.role === role) : null

              return (
                <TabsTrigger
                  key={role}
                  value={role}
                  className={`data-[state=active]:bg-blue-100 ${role === activeRole ? "" : "opacity-70"}`}
                  disabled={role !== playerRole}
                >
                  <div className="flex flex-col items-center">
                    <span>{role.toUpperCase()}</span>
                    <span className="text-xs text-gray-500">{player ? player.name : "AI Player"}</span>
                  </div>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>

        {showHelp && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="bg-orange-100 rounded-full p-3 h-fit">
                  <Info className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">Quick Help</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      You are the <strong>{playerRole.charAt(0).toUpperCase() + playerRole.slice(1)}</strong> - you
                      receive orders from customers and place orders to your supplier
                    </li>
                    <li>Each round, you'll receive customer orders that you must fulfill from your inventory</li>
                    <li>If you don't have enough inventory, the unfulfilled orders become backlog</li>
                    <li>You pay 5 MAD per case in inventory per round and 10 MAD per case in backlog per round</li>
                    <li>Orders take 2 rounds to arrive - plan ahead!</li>
                    <li>Your goal is to minimize your total costs over all rounds</li>
                    <li>Watch for scenario challenges that may disrupt your supply chain</li>
                    <li>Use the Decision Impact Analysis to understand how your orders affect performance</li>
                    <li>Export your game data to Excel for detailed analysis</li>
                  </ul>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowHelp(false)}>
                    Close Help
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Status */}
        <ReconnectionHandler
          isConnected={isConnected}
          onReconnect={() => {
            if (typeof reconnect === "function") {
              reconnect()
            }
          }}
        />

        {/* Active Scenario Alert */}
        {activeScenario && (
          <ScenarioAlert
            type={activeScenario.type}
            description={activeScenario.description}
            effect={activeScenario.effect}
            roundsRemaining={activeScenario.roundsRemaining}
          />
        )}

        {/* Backlog Alert */}
        {backlogStatus !== "none" && (
          <Alert
            className={`mb-4 ${
              backlogStatus === "danger"
                ? "bg-red-50 border-red-200 text-red-800"
                : backlogStatus === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 ${
                backlogStatus === "danger"
                  ? "text-red-600"
                  : backlogStatus === "warning"
                    ? "text-amber-600"
                    : "text-blue-600"
              }`}
            />
            <AlertTitle>Backlog Alert</AlertTitle>
            <AlertDescription>
              You currently have <strong>{backlog} cases</strong> in backlog.
              {backlogStatus === "danger"
                ? " This is a critical level and is costing you " + (backlog * 10).toFixed(2) + " MAD per round!"
                : backlogStatus === "warning"
                  ? " This is costing you " + (backlog * 10).toFixed(2) + " MAD per round."
                  : " This is costing you " + (backlog * 10).toFixed(2) + " MAD per round."}
            </AlertDescription>
          </Alert>
        )}

        {/* Cost Warning Alert */}
        {costStatus !== "normal" && (
          <Alert
            className={`mb-4 ${
              costStatus === "danger"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <AlertTriangle className={`h-4 w-4 ${costStatus === "danger" ? "text-red-600" : "text-amber-600"}`} />
            <AlertTitle>High Cost Warning</AlertTitle>
            <AlertDescription>
              Your current round cost of {roundCost.toFixed(2)} MAD is{" "}
              {costStatus === "danger" ? "critically high" : "higher than optimal"}. Consider adjusting your inventory
              and order strategy.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Customer Order Panel */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Customer Order</CardTitle>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-2 h-fit">
                  <ArrowDown className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-4xl font-bold">{incomingOrder}</div>
                {backlog > 0 && (
                  <div className="text-sm text-red-500">+{backlog} backlog</div>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Total demand: {incomingOrder + backlog} cases
              </div>
              <div className="mt-4 h-24">
                <GameChart data={demandHistory.slice(-10)} color="#3B82F6" type="bar" maxValue={10} />
              </div>
            </CardContent>
          </Card>

          {/* Outgoing Transport Panel - Enhanced */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Outgoing Transport</CardTitle>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              <CardDescription>Shipping to customers this week</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 rounded-full p-2 h-fit">
                  <Truck className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-4xl font-bold">{actualOutgoingAmount}</div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {actualOutgoingAmount < (backlog + incomingOrder)
                  ? `Limited by inventory (${inventory} available)`
                  : `Fulfilling all orders (${backlog + incomingOrder})`}
              </div>
              <div className="mt-4 h-24">
                <GameChart 
                  data={[...inventoryHistory, inventory].slice(-10).map((inv, i) => {
                    // Calculate what would have been fulfilled in each period
                    const period = currentRound - 10 + i;
                    if (period < 1) return 0;
                    
                    const periodBacklog = period < backlogHistory.length ? backlogHistory[period] : 0;
                    const periodDemand = period < demandHistory.length ? demandHistory[period] : 0;
                    const totalDemand = periodBacklog + periodDemand;
                    
                    // Fulfilled amount is limited by inventory
                    return Math.min(inv, totalDemand);
                  })} 
                  color="#F97316" 
                  type="bar" 
                  maxValue={10} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Add a New Supplier Order Panel */}
          <Card className="border-purple-200">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Supplier Order</CardTitle>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              <CardDescription>Your order to supplier</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 rounded-full p-2 h-fit">
                  <Truck className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-4xl font-bold">{outgoingTransport}</div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Order for next round: {orderPlaced ? orderAmount : "Not placed yet"}
              </div>
              <div className="mt-4 h-24">
                <GameChart data={orderHistory.slice(-10)} color="#8B5CF6" type="bar" maxValue={10} />
              </div>
            </CardContent>
          </Card>

          {/* Week Cost Panel - Modified to show cost breakdown */}
          <Card
            className={`${
              costStatus === "danger" ? "border-red-300" : costStatus === "warning" ? "border-amber-300" : ""
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Week Cost</CardTitle>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-around">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-24 h-24">
                      <circle cx="48" cy="48" r="36" fill="white" stroke="#E5E7EB" strokeWidth="8" />
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        fill="transparent"
                        stroke={costStatus === "danger" ? "#EF4444" : costStatus === "warning" ? "#F59E0B" : "#22C55E"}
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 36}
                        strokeDashoffset={2 * Math.PI * 36 * (1 - Math.min(1, roundCost / 100))}
                        transform="rotate(-90 48 48)"
                      />
                    </svg>
                    <div
                      className={`absolute text-xl font-bold ${
                        costStatus === "danger" ? "text-red-600" : costStatus === "warning" ? "text-amber-600" : ""
                      }`}
                    >
                      {roundCost.toFixed(2)} MAD
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">(Current week costs)</div>
                  <div className="text-xs mt-2">
                    <div className="flex justify-between">
                      <span>Inventory:</span>
                      <span className="font-medium">{(inventory * 5).toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Backlog:</span>
                      <span className="font-medium">{(backlog * 10).toFixed(2)} MAD</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-24 h-24">
                      <circle cx="48" cy="48" r="36" fill="white" stroke="#E5E7EB" strokeWidth="8" />
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        fill="transparent"
                        stroke="#22C55E"
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 36}
                        strokeDashoffset={2 * Math.PI * 36 * (1 - Math.min(1, cumulativeCost / 1000))}
                        transform="rotate(-90 48 48)"
                      />
                    </svg>
                    <div className="absolute text-xl font-bold">{cumulativeCost.toFixed(2)} MAD</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">(Total costs)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Panel */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Stock</CardTitle>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 rounded-full p-2 h-fit">
                  <Warehouse className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-4xl font-bold">{inventory}</div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Fulfillment rate: {backlog + incomingOrder > 0 ? Math.min(100, Math.round((inventory / (backlog + incomingOrder)) * 100)) : 100}%
              </div>
              <div className="mt-4 h-24">
                <GameChart data={inventoryHistory.slice(-10)} color="#22C55E" type="bar" maxValue={20} />
              </div>
            </CardContent>
          </Card>

          {/* Backlog Panel - Enhanced */}
          <Card
            className={`${
              backlogStatus === "danger"
                ? "border-red-300"
                : backlogStatus === "warning"
                  ? "border-amber-300"
                  : backlogStatus === "active"
                    ? "border-blue-300"
                    : ""
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Backlog</CardTitle>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              <CardDescription>Unfulfilled customer orders</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4">
                <div
                  className={`rounded-full p-2 h-fit ${
                    backlogStatus === "danger"
                      ? "bg-red-100"
                      : backlogStatus === "warning"
                        ? "bg-amber-100"
                        : backlogStatus === "active"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                  }`}
                >
                  <AlertTriangle
                    className={`h-5 w-5 ${
                      backlogStatus === "danger"
                        ? "text-red-600"
                        : backlogStatus === "warning"
                          ? "text-amber-600"
                          : backlogStatus === "active"
                            ? "text-blue-600"
                            : "text-gray-400"
                    }`}
                  />
                </div>
                <div
                  className={`text-4xl font-bold ${
                    backlogStatus === "danger"
                      ? "text-red-600"
                      : backlogStatus === "warning"
                        ? "text-amber-600"
                        : backlogStatus === "active"
                          ? "text-blue-600"
                          : ""
                  }`}
                >
                  {backlog}
                </div>
                {backlog > 0 && (
                  <div className="text-sm text-gray-500">Cost: {(backlog * 10).toFixed(2)} MAD/round</div>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {backlog > 0 
                  ? `${Math.min(inventory, backlog)} cases will be fulfilled this round`
                  : "No backlog to fulfill"}
              </div>
              <div className="mt-4 h-24">
                <GameChart
                  data={backlogHistory.slice(-10)}
                  color={
                    backlogStatus === "danger"
                      ? "#EF4444"
                      : backlogStatus === "warning"
                        ? "#F59E0B"
                        : backlogStatus === "active"
                          ? "#3B82F6"
                          : "#9CA3AF"
                  }
                  type="bar"
                  maxValue={10}
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Fulfillment Panel - New */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Customer Fulfillment</CardTitle>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              <CardDescription>What you can actually deliver this week</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 rounded-full p-2 h-fit">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-4xl font-bold">{actualOutgoingAmount}</div>
                <div className="text-sm text-gray-500">
                  out of {backlog + incomingOrder} demanded
                </div>
              </div>
              
              <div className="relative pt-1 mt-2">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                      Fulfillment Rate
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-green-600">
                      {backlog + incomingOrder > 0 
                        ? Math.min(100, Math.round((actualOutgoingAmount / (backlog + incomingOrder)) * 100)) 
                        : 100}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                  <div 
                    style={{ width: `${backlog + incomingOrder > 0 
                      ? Math.min(100, Math.round((actualOutgoingAmount / (backlog + incomingOrder)) * 100)) 
                      : 100}%` }} 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500">
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incoming Delivery Panel - Enhanced */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Incoming Delivery</CardTitle>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              <CardDescription>Expected next week from supplier</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 rounded-full p-2 h-fit">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-4xl font-bold">{incomingShipment}</div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Based on order placed 2 weeks ago
              </div>
              <div className="mt-4 h-24">
                <GameChart
                  data={[...Array(10)].map((_, i) => {
                    const index = currentRound - 10 + i
                    if (index < 0) return 0
                    const historyIndex = index - 3
                    return historyIndex >= 0 && historyIndex < orderHistory.length ? orderHistory[historyIndex] : 0
                  })}
                  color="#8B5CF6"
                  type="bar"
                  maxValue={10}
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Panel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">New Order</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Input
                type="number"
                min="0"
                placeholder="New order"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                disabled={orderPlaced}
                className="text-lg mb-4"
              />

              <div className="flex justify-between items-center">
                <Button
                  onClick={placeOrder}
                  disabled={!orderAmount || orderPlaced}
                  className="bg-orange-500 hover:bg-orange-600 w-full"
                >
                  {orderPlaced ? "ORDER PLACED" : "PLACE ORDER"}
                </Button>
              </div>

              {orderPlaced ? (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={advanceToNextRound} className="w-full">
                    CONTINUE TO NEXT ROUND
                  </Button>
                </div>
              ) : (
                <div className="mt-4 flex justify-center items-center text-gray-400">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-2"></div>
                  WAITING FOR PLAYS
                </div>
              )}
            </CardContent>
          </Card>

          {/* Decision Impact Analysis */}
          <DecisionImpact
            currentOrder={Number.parseInt(orderAmount) || 0}
            averageOrder={averageOrder}
            currentDemand={incomingOrder}
            averageDemand={averageDemand}
            inventory={inventory}
            backlog={backlog}
            impactAnalysis={decisionImpact}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Supply Chain Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="costs">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="costs">Costs</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="backlog">Backlog</TabsTrigger>
                </TabsList>

                <TabsContent value="costs" className="h-64">
                  <GameChart
                    data={costHistory}
                    color="#F97316"
                    type="line"
                    maxValue={Math.max(...costHistory, 20)}
                    labels={Array.from({ length: costHistory.length }, (_, i) => i + 1)}
                    title="Cost per Round"
                    yLabel="Cost (MAD)"
                    xLabel="Round"
                  />
                </TabsContent>

                <TabsContent value="inventory" className="h-64">
                  <GameChart
                    data={inventoryHistory}
                    color="#22C55E"
                    type="line"
                    maxValue={Math.max(...inventoryHistory, 20)}
                    labels={Array.from({ length: inventoryHistory.length }, (_, i) => i + 1)}
                    title="Inventory Levels"
                    yLabel="Cases"
                    xLabel="Round"
                  />
                </TabsContent>

                <TabsContent value="backlog" className="h-64">
                  <GameChart
                    data={backlogHistory}
                    color="#EF4444"
                    type="line"
                    maxValue={Math.max(...backlogHistory, 10)}
                    labels={Array.from({ length: backlogHistory.length }, (_, i) => i + 1)}
                    title="Backlog Levels"
                    yLabel="Cases"
                    xLabel="Round"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supply Chain Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="bullwhip">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="bullwhip">Bullwhip Effect</TabsTrigger>
                  <TabsTrigger value="comparison">Order vs. Demand</TabsTrigger>
                </TabsList>

                <TabsContent value="bullwhip" className="h-64">
                  <div className="h-full flex flex-col justify-center">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Customer Demand Variability</span>
                          <span className="font-medium">
                            {demandHistory.length > 1 ? calculateVariability(demandHistory).toFixed(2) : "N/A"}x
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full"
                            style={{ width: `${Math.min(100, (calculateVariability(demandHistory) / 5) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Your Order Variability</span>
                          <span className="font-medium">
                            {orderHistory.length > 1 ? calculateVariability(orderHistory).toFixed(2) : "N/A"}x
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-400 rounded-full"
                            style={{ width: `${Math.min(100, (calculateVariability(orderHistory) / 5) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Bullwhip Ratio</span>
                          <span className="font-medium">
                            {orderHistory.length > 1 && demandHistory.length > 1
                              ? (calculateVariability(orderHistory) / calculateVariability(demandHistory)).toFixed(2)
                              : "N/A"}
                            x
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-400 rounded-full"
                            style={{
                              width: `${Math.min(100, (calculateVariability(orderHistory) / calculateVariability(demandHistory) / 3) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 text-sm text-gray-500">
                      <p>
                        <strong>Bullwhip Effect:</strong> When order variability exceeds demand variability, it
                        indicates the presence of the bullwhip effect in your supply chain.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="comparison" className="h-64">
                  <GameChart
                    data={[
                      demandHistory.slice(-10),
                      orderHistory.slice(-10).concat(Array(Math.max(0, 10 - orderHistory.length)).fill(0)),
                    ]}
                    color={["#3B82F6", "#F97316"]}
                    type="line"
                    maxValue={Math.max(...demandHistory, ...orderHistory, 10)}
                    labels={Array.from({ length: 10 }, (_, i) => Math.max(1, currentRound - 9 + i))}
                    title="Orders vs. Demand"
                    yLabel="Cases"
                    xLabel="Round"
                    legend={["Demand", "Your Orders"]}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics - {playerRole.charAt(0).toUpperCase() + playerRole.slice(1)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Average Inventory</div>
                  <div className="text-2xl font-bold">
                    {inventoryHistory.length > 0
                      ? (inventoryHistory.reduce((a, b) => a + b, 0) / inventoryHistory.length).toFixed(1)
                      : "0"}
                  </div>
                  <div className="text-xs text-gray-500">cases</div>
                </div>

                <div
                  className={`p-4 rounded-lg ${
                    backlogStatus === "danger"
                      ? "bg-red-50"
                      : backlogStatus === "warning"
                        ? "bg-amber-50"
                        : backlogStatus === "active"
                          ? "bg-blue-50"
                          : "bg-gray-50"
                  }`}
                >
                  <div className="text-sm text-gray-500 mb-1">Average Backlog</div>
                  <div
                    className={`text-2xl font-bold ${
                      backlogStatus === "danger"
                        ? "text-red-600"
                        : backlogStatus === "warning"
                          ? "text-amber-600"
                          : backlogStatus === "active"
                            ? "text-blue-600"
                            : ""
                    }`}
                  >
                    {backlogHistory.length > 0
                      ? (backlogHistory.reduce((a, b) => a + b, 0) / backlogHistory.length).toFixed(1)
                      : "0"}
                  </div>
                  <div className="text-xs text-gray-500">cases</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Average Order Size</div>
                  <div className="text-2xl font-bold">
                    {orderHistory.length > 0
                      ? (orderHistory.reduce((a, b) => a + b, 0) / orderHistory.length).toFixed(1)
                      : "0"}
                  </div>
                  <div className="text-xs text-gray-500">cases</div>
                </div>

                <div
                  className={`p-4 rounded-lg ${
                    costStatus === "danger" ? "bg-red-50" : costStatus === "warning" ? "bg-amber-50" : "bg-gray-50"
                  }`}
                >
                  <div className="text-sm text-gray-500 mb-1">Average Cost per Round</div>
                  <div
                    className={`text-2xl font-bold ${
                      costStatus === "danger" ? "text-red-600" : costStatus === "warning" ? "text-amber-600" : ""
                    }`}
                  >
                    {costHistory.length > 0
                      ? (costHistory.reduce((a, b) => a + b, 0) / costHistory.length).toFixed(2)
                      : "0.00"}{" "}
                    MAD
                  </div>
                  <div className="text-xs text-gray-500">per round</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate variability (standard deviation / mean)
function calculateVariability(data: number[]): number {
  if (data.length <= 1) return 1

  const mean = data.reduce((a: number, b: number) => a + b, 0) / data.length
  if (mean === 0) return 1

  const variance = data.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / data.length
  return Math.sqrt(variance) / mean
}

