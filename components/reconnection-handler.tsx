"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff } from "lucide-react"

interface ReconnectionHandlerProps {
  isConnected: boolean
  onReconnect: () => void
}

export function ReconnectionHandler({ isConnected, onReconnect }: ReconnectionHandlerProps) {
  const [showAlert, setShowAlert] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  useEffect(() => {
    if (!isConnected) {
      // Show the alert after a short delay to avoid flashing during normal connection
      const timer = setTimeout(() => {
        setShowAlert(true)
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setShowAlert(false)
      setReconnectAttempts(0)
    }
  }, [isConnected])

  const handleReconnect = () => {
    setReconnectAttempts((prev) => prev + 1)
    onReconnect()
  }

  if (!showAlert) return null

  return (
    <Alert className="mb-4 bg-red-50 border-red-200 text-red-800">
      <WifiOff className="h-4 w-4 text-red-600" />
      <AlertTitle>Connection Lost</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          You've been disconnected from the game server.
          {reconnectAttempts > 0 && ` Reconnection attempts: ${reconnectAttempts}`}
        </p>
        <Button variant="outline" size="sm" className="w-fit mt-2 bg-white" onClick={handleReconnect}>
          <Wifi className="h-4 w-4 mr-2" />
          Reconnect
        </Button>
      </AlertDescription>
    </Alert>
  )
}

