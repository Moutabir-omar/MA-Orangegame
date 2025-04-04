"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabaseClient } from "./supabase-client"
import type { RealtimeChannel, RealtimePresenceState } from "@supabase/supabase-js"
import { toast } from "@/components/ui/use-toast"

// Define types for game events
export type GameEvent = {
  type: string
  payload: any
  sender: string
  timestamp: number
}

export type PlayerAction = {
  round: number
  role: string
  action: string
  value: number
  timestamp: number
}

// Update the GameState type to include gameCode and track taken roles
export type GameState = {
  gameCode?: string
  round: number
  players: {
    id: string
    name: string
    role: string
    connected: boolean
    inventory: number
    backlog: number
    orders: number[]
    costs: number[]
    is_ai?: boolean
  }[]
  currentDemand: number
  takenRoles?: string[]
  scenarioActive?: {
    type: string
    description: string
    effect: string
    roundsRemaining: number
  }
}

// Hook for using Supabase Realtime in components
export function useGameRealtime(gameId: string, playerId: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null)
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [presenceState, setPresenceState] = useState<RealtimePresenceState>({})

  // Use refs to avoid dependency issues in useEffect
  const gameIdRef = useRef(gameId)
  const playerIdRef = useRef(playerId)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Update refs when props change
  useEffect(() => {
    gameIdRef.current = gameId
    playerIdRef.current = playerId
  }, [gameId, playerId])

  // Memoize fetchGameState to avoid recreating it on every render
  const fetchGameState = useCallback(async (gameId: string) => {
    if (!gameId || gameId === "temp") return

    try {
      // Fetch game data
      const { data: gameData, error: gameError } = await supabaseClient
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single()

      if (gameError) throw gameError

      // Fetch players
      const { data: playersData, error: playersError } = await supabaseClient
        .from("players")
        .select("*")
        .eq("game_id", gameId)

      if (playersError) throw playersError

      // Fetch player actions
      const { data: actionsData, error: actionsError } = await supabaseClient
        .from("player_actions")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true })

      if (actionsError) throw actionsError

      // Process player actions to get orders and costs
      const playerMap = new Map<string, { orders: number[]; costs: number[] }>()

      playersData.forEach((player) => {
        playerMap.set(player.id, { orders: [], costs: [] })
      })

      actionsData.forEach((action) => {
        if (action.action === "placeOrder") {
          const playerData = playerMap.get(action.player_id)
          if (playerData) {
            playerData.orders.push(action.value)
          }
        }
      })

      // Fetch player stats for costs
      const { data: statsData, error: statsError } = await supabaseClient
        .from("player_stats")
        .select("*")
        .eq("game_id", gameId)
        .order("round", { ascending: true })

      if (statsError) throw statsError

      statsData.forEach((stat) => {
        const playerData = playerMap.get(stat.player_id)
        if (playerData) {
          playerData.costs.push(Number(stat.round_cost))
        }
      })

      // Build game state
      const state: GameState = {
        gameCode: gameData.code,
        round: gameData.round,
        currentDemand: gameData.current_demand,
        players: playersData.map((player) => ({
          id: player.id,
          name: player.name,
          role: player.role,
          connected: player.connected,
          inventory: player.inventory,
          backlog: player.backlog,
          orders: playerMap.get(player.id)?.orders || [],
          costs: playerMap.get(player.id)?.costs || [],
          is_ai: player.is_ai,
        })),
        takenRoles: playersData.map((player) => player.role),
        scenarioActive: gameData.scenario_active,
      }

      setGameState(state)
    } catch (error) {
      console.error("Error fetching game state:", error)
    }
  }, [])

  // Set up the channel only once when the component mounts or when gameId changes
  useEffect(() => {
    // Skip if no gameId or if it's the temp ID
    if (!gameId) return

    console.log("Setting up channel for game:", gameId, "with player:", playerId)

    // Clean up previous channel if it exists
    if (channelRef.current) {
      console.log("Unsubscribing from previous channel")
      channelRef.current.unsubscribe()
    }

    // Create a channel for this game
    console.log("Creating new channel for game:", gameId)
    const gameChannel = supabaseClient.channel(`game:${gameId}`, {
      config: {
        presence: {
          key: playerId,
        },
      },
    })

    // Set up presence tracking
    gameChannel.on("presence", { event: "sync" }, () => {
      const state = gameChannel.presenceState()
      console.log("Presence state updated:", state)
      setPresenceState(state)
      setIsConnected(true)
    })

    // Handle broadcast messages
    gameChannel.on("broadcast", { event: "game_event" }, (payload) => {
      console.log("Received broadcast:", payload)
      const event = payload.payload as GameEvent

      if (event.type === "gameState") {
        setGameState(event.payload)
      } else if (event.type === "playerAction") {
        setLastEvent(event)

        // Add to player actions if it's a placeOrder action
        if (event.type === "playerAction" && event.payload.action === "placeOrder") {
          setPlayerActions((prev) => [
            ...prev,
            {
              round: event.payload.round,
              role: event.payload.role,
              action: event.payload.action,
              value: event.payload.amount,
              timestamp: event.timestamp,
            },
          ])
        }
      } else if (event.type === "error") {
        // Handle error events
        toast({
          title: "Error",
          description: event.payload.message,
          variant: "destructive",
        })
      } else if (event.type === "joinSuccess") {
        // Handle join success events
        toast({
          title: "Joined Game",
          description: `You joined as ${event.payload.role}`,
        })
      }
    })

    // Subscribe to database changes
    gameChannel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          // Update game state when the game record changes
          fetchGameState(gameId)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "player_actions",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          // Handle new player actions
          const action = payload.new as any
          setLastEvent({
            type: "playerAction",
            payload: {
              role: action.role,
              action: action.action,
              amount: action.value,
              round: action.round,
            },
            sender: action.player_id,
            timestamp: new Date(action.created_at).getTime(),
          })
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          // Update game state when a new player joins
          fetchGameState(gameId)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          // Update game state when a player record changes
          fetchGameState(gameId)
        },
      )

    // Subscribe to the channel
    gameChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        // Track presence
        try {
          await gameChannel.track({
            user_id: playerId,
            online_at: new Date().toISOString(),
          })

          // Fetch initial game state
          if (gameId !== "temp") {
            fetchGameState(gameId)
          }
        } catch (error) {
          console.error("Error tracking presence:", error)
        }
      } else if (status === "CHANNEL_ERROR") {
        console.error("Channel error, attempting to reconnect...")
        setTimeout(() => {
          gameChannel.subscribe()
        }, 3000)
      }
    })

    // Store the channel
    channelRef.current = gameChannel
    setChannel(gameChannel)

    // Clean up on unmount
    return () => {
      gameChannel.unsubscribe()
    }
  }, [gameId, playerId, fetchGameState])

  const handleJoinGame = useCallback(
    async (event: GameEvent) => {
      if (!channelRef.current) {
        console.error("Channel not connected")
        return
      }

      try {
        console.log("Handling join game event:", event.payload)
        const { name, role, gameCode, gameId: targetGameIdParam } = event.payload

        console.log("Join parameters:", {
          name,
          role,
          gameCode,
          targetGameIdParam,
          currentGameId: gameIdRef.current,
        })

        // If gameCode is provided, find the game
        let targetGameId = gameIdRef.current
        if (gameCode) {
          const { data: gameData, error: gameError } = await supabaseClient
            .from("games")
            .select("id")
            .eq("code", gameCode)
            .single()

          if (gameError) {
            console.error("Game not found:", gameError)
            channelRef.current.send({
              type: "broadcast",
              event: "game_event",
              payload: {
                type: "error",
                payload: {
                  message: "Game not found. Please check the game code.",
                  code: "GAME_NOT_FOUND",
                },
                sender: "system",
                timestamp: Date.now(),
              },
            })
            return
          }
          targetGameId = gameData.id
        } else if (targetGameIdParam) {
          targetGameId = targetGameIdParam
        }

        console.log("Target game ID:", targetGameId)

        // Check if role is already taken
        const { data: existingPlayer, error: roleCheckError } = await supabaseClient
          .from("players")
          .select("id")
          .eq("game_id", targetGameId)
          .eq("role", role)
          .maybeSingle()

        if (roleCheckError) {
          console.error("Role check error:", roleCheckError)
          throw roleCheckError
        }

        if (existingPlayer) {
          // Role is taken, send error
          console.log("Role already taken:", role)
          channelRef.current.send({
            type: "broadcast",
            event: "game_event",
            payload: {
              type: "error",
              payload: {
                message: "This role is already taken. Please choose another role.",
                code: "ROLE_TAKEN",
              },
              sender: "system",
              timestamp: Date.now(),
            },
          })
          return
        }

        // Insert new player
        console.log("Inserting new player:", {
          game_id: targetGameId,
          name,
          role,
        })

        const { data: newPlayer, error: insertError } = await supabaseClient
          .from("players")
          .insert({
            game_id: targetGameId,
            name,
            role,
            is_ai: false,
            inventory: 12,
            backlog: 0,
            connected: true,
          })
          .select()
          .single()

        if (insertError) {
          console.error("Insert error:", insertError)
          throw insertError
        }

        console.log("New player inserted:", newPlayer)

        // Send join success event
        channelRef.current.send({
          type: "broadcast",
          event: "game_event",
          payload: {
            type: "joinSuccess",
            payload: {
              playerId: newPlayer.id,
              role,
              name,
              gameId: targetGameId,
            },
            sender: "system",
            timestamp: Date.now(),
          },
        })

        // Update game state
        if (targetGameId !== "temp") {
          await fetchGameState(targetGameId)
        }
      } catch (error) {
        console.error("Error joining game:", error)
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "game_event",
            payload: {
              type: "error",
              payload: {
                message: "Failed to join game. Please try again.",
                code: "JOIN_FAILED",
              },
              sender: "system",
              timestamp: Date.now(),
            },
          })
        }
      }
    },
    [fetchGameState],
  )

  const handlePlaceOrder = useCallback(async (event: GameEvent) => {
    if (!channelRef.current) {
      console.error("Channel not connected")
      return
    }

    try {
      console.log("Handling place order event:", event)
      const { role, amount } = event.payload
      const currentGameId = gameIdRef.current

      // Find player by role
      const { data: player, error: playerError } = await supabaseClient
        .from("players")
        .select("id")
        .eq("game_id", currentGameId)
        .eq("role", role)
        .single()

      if (playerError) {
        console.error("Player not found:", playerError)
        throw playerError
      }

      console.log("Found player:", player)

      // Get current round
      const { data: game, error: gameError } = await supabaseClient
        .from("games")
        .select("round")
        .eq("id", currentGameId)
        .single()

      if (gameError) {
        console.error("Game not found:", gameError)
        throw gameError
      }

      console.log("Found game:", game)

      // Insert player action
      console.log("Inserting player action:", {
        game_id: currentGameId,
        player_id: player.id,
        round: game.round,
        action: "placeOrder",
        value: amount,
      })

      const { error: actionError } = await supabaseClient.from("player_actions").insert({
        game_id: currentGameId,
        player_id: player.id,
        round: game.round,
        action: "placeOrder",
        value: amount,
      })

      if (actionError) {
        console.error("Action insert error:", actionError)
        throw actionError
      }

      // Broadcast the event
      channelRef.current.send({
        type: "broadcast",
        event: "game_event",
        payload: {
          type: "playerAction",
          payload: {
            role,
            action: "placeOrder",
            amount,
            round: game.round,
          },
          sender: playerIdRef.current,
          timestamp: Date.now(),
        },
      })
    } catch (error) {
      console.error("Error placing order:", error)
    }
  }, [])

  const handleAdvanceRound = useCallback(
    async (event: GameEvent) => {
      try {
        const currentGameId = gameIdRef.current

        // Get current game state
        const { data: game, error: gameError } = await supabaseClient
          .from("games")
          .select("*")
          .eq("id", currentGameId)
          .single()

        if (gameError) throw gameError

        // Get all players
        const { data: players, error: playersError } = await supabaseClient
          .from("players")
          .select("*")
          .eq("game_id", currentGameId)

        if (playersError) throw playersError

        // Generate new demand (between 2 and 8)
        const newDemand = Math.floor(Math.random() * 7) + 2

        // Check if we should trigger a scenario (10% chance)
        let scenarioActive = game.scenario_active
        if (!scenarioActive && Math.random() < 0.1) {
          const scenarios = [
            {
              type: "demandSpike",
              description: "Sudden Demand Spike",
              effect: "Customer demand increased by 50% for the next 3 rounds",
              roundsRemaining: 3,
            },
            {
              type: "supplyDisruption",
              description: "Supply Chain Disruption",
              effect: "Shipping delays increased by 1 round for the next 4 rounds",
              roundsRemaining: 4,
            },
            {
              type: "qualityIssue",
              description: "Product Quality Issue",
              effect: "Return rate increased, effective inventory reduced by 20% for 2 rounds",
              roundsRemaining: 2,
            },
          ]

          scenarioActive = scenarios[Math.floor(Math.random() * scenarios.length)]

          // Apply scenario effects
          if (scenarioActive.type === "demandSpike") {
            scenarioActive.newDemand = Math.floor(newDemand * 1.5)
          }
        } else if (scenarioActive) {
          // Update active scenario
          scenarioActive.roundsRemaining--

          // Apply ongoing effects
          if (scenarioActive.type === "demandSpike") {
            scenarioActive.newDemand = Math.floor(newDemand * 1.5)
          }

          // Remove scenario if completed
          if (scenarioActive.roundsRemaining <= 0) {
            scenarioActive = null
          }
        }

        // Apply scenario to demand if needed
        const finalDemand = scenarioActive?.newDemand || newDemand

        // Create new round record
        const { error: roundError } = await supabaseClient.from("game_rounds").insert({
          game_id: currentGameId,
          round: game.round + 1,
          demand: finalDemand,
          scenario: scenarioActive?.type || null,
        })

        if (roundError) throw roundError

        // Update game state
        const { error: updateError } = await supabaseClient
          .from("games")
          .update({
            round: game.round + 1,
            current_demand: finalDemand,
            scenario_active: scenarioActive,
          })
          .eq("id", currentGameId)

        if (updateError) throw updateError

        // Process player stats for each player
        for (const player of players) {
          // Get player actions for this round
          const { data: actions, error: actionsError } = await supabaseClient
            .from("player_actions")
            .select("*")
            .eq("game_id", currentGameId)
            .eq("player_id", player.id)
            .eq("round", game.round)
            .eq("action", "placeOrder")

          if (actionsError) throw actionsError

          // Get the order amount (or 0 if no order was placed)
          const orderAmount = actions.length > 0 ? actions[0].value : 0

          // Get previous orders for incoming shipment (from 2 rounds ago)
          const { data: previousActions, error: prevError } = await supabaseClient
            .from("player_actions")
            .select("*")
            .eq("game_id", currentGameId)
            .eq("player_id", player.id)
            .eq("round", Math.max(1, game.round - 2))
            .eq("action", "placeOrder")

          if (prevError) throw prevError

          const incomingShipment = previousActions.length > 0 ? previousActions[0].value : 0

          // Calculate new inventory and backlog
          const updatedInventory = player.inventory + incomingShipment
          const fulfilledOrders = Math.min(updatedInventory, game.current_demand + player.backlog)
          const newInventory = updatedInventory - fulfilledOrders
          const newBacklog = game.current_demand + player.backlog - fulfilledOrders

          // Calculate costs
          const inventoryCost = newInventory * 5 // 5 MAD per case
          const backlogCost = newBacklog * 10 // 10 MAD per case
          const roundCost = inventoryCost + backlogCost

          // Get previous cumulative cost
          const { data: prevStats, error: prevStatsError } = await supabaseClient
            .from("player_stats")
            .select("cumulative_cost")
            .eq("game_id", currentGameId)
            .eq("player_id", player.id)
            .order("round", { ascending: false })
            .limit(1)

          if (prevStatsError) throw prevStatsError

          const previousCost = prevStats.length > 0 ? Number(prevStats[0].cumulative_cost) : 0
          const cumulativeCost = previousCost + roundCost

          // Insert player stats
          const { error: statsError } = await supabaseClient.from("player_stats").insert({
            game_id: currentGameId,
            player_id: player.id,
            round: game.round,
            inventory: newInventory,
            backlog: newBacklog,
            incoming_order: game.current_demand,
            outgoing_order: orderAmount,
            incoming_shipment: incomingShipment,
            round_cost: roundCost,
            cumulative_cost: cumulativeCost,
          })

          if (statsError) throw statsError

          // Update player record
          const { error: playerUpdateError } = await supabaseClient
            .from("players")
            .update({
              inventory: newInventory,
              backlog: newBacklog,
            })
            .eq("id", player.id)

          if (playerUpdateError) throw playerUpdateError
        }

        // Fetch updated game state
        await fetchGameState(currentGameId)
      } catch (error) {
        console.error("Error advancing round:", error)
      }
    },
    [fetchGameState],
  )

  // Memoize the sendEvent function to avoid recreating it on every render
  const sendEvent = useCallback(
    async (type: string, payload: any) => {
      if (!channelRef.current || !isConnected) {
        console.error("Channel not connected")
        return
      }

      const event: GameEvent = {
        type,
        payload,
        sender: playerIdRef.current,
        timestamp: Date.now(),
      }

      // Handle different event types
      switch (type) {
        case "joinGame":
          await handleJoinGame(event)
          break
        case "placeOrder":
          await handlePlaceOrder(event)
          break
        case "advanceRound":
          await handleAdvanceRound(event)
          break
        case "requestGameState":
          await fetchGameState(gameIdRef.current)
          break
        default:
          // Broadcast the event to all clients
          channelRef.current.send({
            type: "broadcast",
            event: "game_event",
            payload: event,
          })
      }
    },
    [isConnected, handleJoinGame, handlePlaceOrder, handleAdvanceRound, fetchGameState],
  )

  // Memoize the getPlayerActionsForExport function
  const getPlayerActionsForExport = useCallback(async () => {
    try {
      const currentGameId = gameIdRef.current
      const { data, error } = await supabaseClient
        .from("player_actions")
        .select("*")
        .eq("game_id", currentGameId)
        .order("created_at", { ascending: true })

      if (error) throw error

      return data.map((action) => ({
        round: action.round,
        role: action.role || "", // We'll need to join with players to get the role
        action: action.action,
        value: action.value,
        timestamp: new Date(action.created_at).getTime(),
      }))
    } catch (error) {
      console.error("Error getting player actions:", error)
      return []
    }
  }, [])

  // Memoize the createGame function
  const createGame = useCallback(
    async (gameData: {
      name: string
      totalRounds?: number
      roundTime?: number
      gameType?: string
      aiDifficulty?: string
      enableScenarios?: boolean
    }) => {
      try {
        // Generate a game code
        const gameCode = Array.from({ length: 6 }, () =>
          "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".charAt(Math.floor(Math.random() * 32)),
        ).join("")

        const { data, error } = await supabaseClient
          .from("games")
          .insert({
            name: gameData.name,
            code: gameCode,
            total_rounds: gameData.totalRounds || 50,
            round_time: gameData.roundTime || 45,
            game_type: gameData.gameType || "public",
            ai_difficulty: gameData.aiDifficulty || "adaptive",
            enable_scenarios: gameData.enableScenarios !== undefined ? gameData.enableScenarios : true,
          })
          .select()
          .single()

        if (error) throw error

        return data
      } catch (error) {
        console.error("Error creating game:", error)
        return null
      }
    },
    [],
  )

  // Memoize the reconnect function
  const reconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    // Create a new channel
    const newChannel = supabaseClient.channel(`game:${gameIdRef.current}`, {
      config: {
        presence: {
          key: playerIdRef.current,
        },
      },
    })

    // Set up presence tracking
    newChannel.on("presence", { event: "sync" }, () => {
      const state = newChannel.presenceState()
      setPresenceState(state)
      setIsConnected(true)
    })

    // Handle broadcast messages
    newChannel.on("broadcast", { event: "game_event" }, (payload) => {
      const event = payload.payload as GameEvent

      if (event.type === "gameState") {
        setGameState(event.payload)
      } else if (event.type === "playerAction") {
        setLastEvent(event)

        // Add to player actions if it's a placeOrder action
        if (event.type === "playerAction" && event.payload.action === "placeOrder") {
          setPlayerActions((prev) => [
            ...prev,
            {
              round: event.payload.round,
              role: event.payload.role,
              action: event.payload.action,
              value: event.payload.amount,
              timestamp: event.timestamp,
            },
          ])
        }
      } else if (event.type === "error") {
        // Handle error events
        toast({
          title: "Error",
          description: event.payload.message,
          variant: "destructive",
        })
      } else if (event.type === "joinSuccess") {
        // Handle join success events
        toast({
          title: "Joined Game",
          description: `You joined as ${event.payload.role}`,
        })
      }
    })

    // Subscribe to database changes
    newChannel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameIdRef.current}`,
        },
        (payload) => {
          // Update game state when the game record changes
          fetchGameState(gameIdRef.current)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "player_actions",
          filter: `game_id=eq.${gameIdRef.current}`,
        },
        (payload) => {
          // Handle new player actions
          const action = payload.new as any
          setLastEvent({
            type: "playerAction",
            payload: {
              role: action.role,
              action: action.action,
              amount: action.value,
              round: action.round,
            },
            sender: action.player_id,
            timestamp: new Date(action.created_at).getTime(),
          })
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameIdRef.current}`,
        },
        (payload) => {
          // Update game state when a new player joins
          fetchGameState(gameIdRef.current)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameIdRef.current}`,
        },
        (payload) => {
          // Update game state when a player record changes
          fetchGameState(gameIdRef.current)
        },
      )

    // Subscribe to the channel
    newChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        // Track presence
        try {
          await newChannel.track({
            user_id: playerIdRef.current,
            online_at: new Date().toISOString(),
          })

          // Fetch initial game state
          fetchGameState(gameIdRef.current)
        } catch (error) {
          console.error("Error tracking presence:", error)
        }
      } else if (status === "CHANNEL_ERROR") {
        console.error("Channel error, attempting to reconnect...")
        setTimeout(() => {
          newChannel.subscribe()
        }, 3000)
      }
    })

    // Update the channel reference
    channelRef.current = newChannel
    setChannel(newChannel)
  }, [fetchGameState])

  return {
    isConnected,
    gameState,
    lastEvent,
    sendEvent,
    getPlayerActionsForExport,
    createGame,
    presenceState,
    reconnect,
  }
}

