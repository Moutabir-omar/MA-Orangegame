"use client"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, TrendingUp, Zap } from "lucide-react"

export type AIDifficulty = "basic" | "intermediate" | "advanced" | "adaptive"

interface AIDifficultySelectorProps {
  value: AIDifficulty
  onChange: (value: AIDifficulty) => void
}

export function AIDifficultySelector({ value, onChange }: AIDifficultySelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AI Difficulty</CardTitle>
        <CardDescription>Select the intelligence level of AI players</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={onChange as (value: string) => void} className="space-y-3">
          <div className="flex items-start space-x-3 border rounded-md p-3 hover:bg-orange-50 cursor-pointer">
            <RadioGroupItem value="basic" id="basic" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="basic" className="flex items-center cursor-pointer">
                <Brain className="h-5 w-5 mr-2 text-blue-500" />
                <span className="font-medium">Basic</span>
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                AI follows simple rules with predictable ordering patterns. Ideal for beginners.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 border rounded-md p-3 hover:bg-orange-50 cursor-pointer">
            <RadioGroupItem value="intermediate" id="intermediate" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="intermediate" className="flex items-center cursor-pointer">
                <TrendingUp className="h-5 w-5 mr-2 text-orange-500" />
                <span className="font-medium">Intermediate</span>
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                AI uses forecasting and maintains safety stock. Provides a moderate challenge.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 border rounded-md p-3 hover:bg-orange-50 cursor-pointer">
            <RadioGroupItem value="advanced" id="advanced" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="advanced" className="flex items-center cursor-pointer">
                <Zap className="h-5 w-5 mr-2 text-red-500" />
                <span className="font-medium">Advanced</span>
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                AI uses sophisticated algorithms to optimize inventory and minimize costs. Challenging!
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 border rounded-md p-3 hover:bg-orange-50 cursor-pointer">
            <RadioGroupItem value="adaptive" id="adaptive" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="adaptive" className="flex items-center cursor-pointer">
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
                  className="mr-2 text-purple-500"
                >
                  <path d="M12 2v4" />
                  <path d="M12 18v4" />
                  <path d="M4.93 4.93l2.83 2.83" />
                  <path d="M16.24 16.24l2.83 2.83" />
                  <path d="M2 12h4" />
                  <path d="M18 12h4" />
                  <path d="M4.93 19.07l2.83-2.83" />
                  <path d="M16.24 7.76l2.83-2.83" />
                </svg>
                <span className="font-medium">Adaptive</span>
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                AI adjusts its strategy based on player performance, providing a balanced challenge.
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
}

