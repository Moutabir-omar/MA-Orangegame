"use client"

// WebSocket service for real-time multiplayer functionality
import { useEffect, useRef, useState } from "react"

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

// Mock WebSocket for development (would be replaced with actual WebSocket in production)
class MockWebSocket {
  private listeners: { [key: string]: ((event: any) => void)[] } = {}
  private gameState: GameState
  private gameId: string
  private playerId: string
  private playerActions: PlayerAction[] = []
  private connected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null

  // Update the MockWebSocket class constructor to include gameCode
  constructor(gameId: string, playerId: string) {
    this.gameId = gameId
    this.playerId = playerId
    this.gameState = {
      gameCode: generateGameCode(),
      round: 1,
      players: [],
      currentDemand: 4,
      takenRoles: [],
    }

    // Simulate connection delay
    setTimeout(() => {
      this.connected = true
      this.emit("open", {})

      // Send initial game state
      this.emit("message", {
        data: JSON.stringify({
          type: "gameState",
          payload: this.gameState,
        }),
      })
    }, 1000)
  }

  send(data: string) {
    if (!this.connected) return

    const event = JSON.parse(data)

    // Handle different event types
    switch (event.type) {
      case "placeOrder":
        this.handlePlaceOrder(event)
        break
      case "joinGame":
        this.handleJoinGame(event)
        break
      case "requestGameState":
        this.sendGameState()
        break
      case "advanceRound":
        this.handleAdvanceRound()
        break
    }
  }

  // Add a function to handle role selection validation
  private handleJoinGame(event: GameEvent) {
    const { name, role } = event.payload

    // Check if role is already taken
    if (this.gameState.takenRoles && this.gameState.takenRoles.includes(role)) {
      // Send error message
      setTimeout(() => {
        this.emit("message", {
          data: JSON.stringify({
            type: "error",
            payload: {
              message: "This role is already taken. Please choose another role.",
              code: "ROLE_TAKEN",
            },
          }),
        })
      }, 300)
      return
    }

    // Add role to taken roles
    if (!this.gameState.takenRoles) {
      this.gameState.takenRoles = []
    }
    this.gameState.takenRoles.push(role)

    // Add player to game state
    this.gameState.players.push({
      id: this.playerId,
      name,
      role,
      connected: true,
      inventory: 12,
      backlog: 0,
      orders: [],
      costs: [0],
    })

    // Broadcast updated game state
    setTimeout(() => {
      this.sendGameState()

      // Also send a specific join success event
      this.emit("message", {
        data: JSON.stringify({
          type: "joinSuccess",
          payload: {
            playerId: this.playerId,
            role,
            name,
          },
        }),
      })
    }, 300)
  }

  private handlePlaceOrder(event: GameEvent) {
    const { role, amount } = event.payload

    // Record player action
    this.playerActions.push({
      round: this.gameState.round,
      role,
      action: "placeOrder",
      value: amount,
      timestamp: Date.now(),
    })

    // Update game state
    const playerIndex = this.gameState.players.findIndex((p) => p.role === role)
    if (playerIndex !== -1) {
      this.gameState.players[playerIndex].orders.push(amount)
    }

    // Broadcast updated game state
    setTimeout(() => {
      this.emit("message", {
        data: JSON.stringify({
          type: "playerAction",
          payload: {
            role,
            action: "placeOrder",
            amount,
          },
        }),
      })
    }, 300)
  }

  private handleAdvanceRound() {
    // Increment round
    this.gameState.round++

    // Generate new demand (between 2 and 8)
    this.gameState.currentDemand = Math.floor(Math.random() * 7) + 2

    // Randomly trigger scenarios (10% chance)
    if (Math.random() < 0.1 && !this.gameState.scenarioActive) {
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

      this.gameState.scenarioActive = scenarios[Math.floor(Math.random() * scenarios.length)]

      // Apply scenario effects
      if (this.gameState.scenarioActive.type === "demandSpike") {
        this.gameState.currentDemand = Math.floor(this.gameState.currentDemand * 1.5)
      }
    } else if (this.gameState.scenarioActive) {
      // Update active scenario
      this.gameState.scenarioActive.roundsRemaining--

      // Apply ongoing effects
      if (this.gameState.scenarioActive.type === "demandSpike") {
        this.gameState.currentDemand = Math.floor(this.gameState.currentDemand * 1.5)
      }

      // Remove scenario if completed
      if (this.gameState.scenarioActive.roundsRemaining <= 0) {
        delete this.gameState.scenarioActive
      }
    }

    // Update player states (simplified)
    this.gameState.players.forEach((player) => {
      // Add random cost between 5-20 MAD per round
      player.costs.push(Math.floor(Math.random() * 15) + 5)
    })

    // Broadcast updated game state
    setTimeout(() => {
      this.sendGameState()
    }, 300)
  }

  private sendGameState() {
    this.emit("message", {
      data: JSON.stringify({
        type: "gameState",
        payload: this.gameState,
      }),
    })
  }

  addEventListener(event: string, callback: (event: any) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  removeEventListener(event: string, callback: (event: any) => void) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
  }

  private emit(event: string, data: any) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach((callback) => callback(data))
  }

  close() {
    this.connected = false
    this.emit("close", {})
  }

  // Get all player actions for export
  getPlayerActions() {
    return this.playerActions
  }
}

// Add a function to generate a game code
function generateGameCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed similar looking characters
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

// Hook for using WebSocket in components
export function useGameWebSocket(gameId: string, playerId: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>([])
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null)
  const socketRef = useRef<MockWebSocket | null>(null)

  useEffect(() => {
    // Create WebSocket connection
    socketRef.current = new MockWebSocket(gameId, playerId)

    // Set up event listeners
    const handleOpen = () => {
      setIsConnected(true)
      // Request initial game state
      sendEvent("requestGameState", {})
    }

    const handleMessage = (event: any) => {
      const data = JSON.parse(event.data)

      if (data.type === "gameState") {
        setGameState(data.payload)
      } else if (data.type === "playerAction") {
        setLastEvent({
          type: data.type,
          payload: data.payload,
          sender: data.payload.role,
          timestamp: Date.now(),
        })
      }
    }

    const handleClose = () => {
      setIsConnected(false)
    }

    socketRef.current.addEventListener("open", handleOpen)
    socketRef.current.addEventListener("message", handleMessage)
    socketRef.current.addEventListener("close", handleClose)

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.removeEventListener("open", handleOpen)
        socketRef.current.removeEventListener("message", handleMessage)
        socketRef.current.removeEventListener("close", handleClose)
        socketRef.current.close()
      }
    }
  }, [gameId, playerId])

  // Function to send events to the server
  const sendEvent = (type: string, payload: any) => {
    if (socketRef.current && isConnected) {
      const event: GameEvent = {
        type,
        payload,
        sender: playerId,
        timestamp: Date.now(),
      }
      socketRef.current.send(JSON.stringify(event))
    }
  }

  // Function to get all player actions for export
  const getPlayerActionsForExport = () => {
    if (socketRef.current) {
      return socketRef.current.getPlayerActions()
    }
    return []
  }

  return {
    isConnected,
    gameState,
    lastEvent,
    sendEvent,
    getPlayerActionsForExport,
  }
}

