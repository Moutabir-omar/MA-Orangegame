"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface GameCompletionProps {
  gameId: string
  round: number
  totalRounds: number
  playerRole: string
  playerName: string
  totalCost: number
  onExport: () => void
}

export function GameCompletion({ 
  gameId, 
  round, 
  totalRounds, 
  playerRole, 
  playerName, 
  totalCost, 
  onExport 
}: GameCompletionProps) {
  const [show, setShow] = useState(false)
  
  useEffect(() => {
    if (round >= totalRounds) {
      setShow(true)
    }
  }, [round, totalRounds])
  
  if (!show) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-orange-700">Game Complete!</CardTitle>
          <CardDescription>
            You've completed all {totalRounds} rounds of the Orange Juice Game
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              \

\

