import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Zap, Truck, AlertCircle } from "lucide-react"

interface ScenarioAlertProps {
  type: string
  description: string
  effect: string
  roundsRemaining: number
}

export function ScenarioAlert({ type, description, effect, roundsRemaining }: ScenarioAlertProps) {
  // Determine icon and color based on scenario type
  let Icon = AlertTriangle
  let bgColor = "bg-amber-50 border-amber-200 text-amber-800"
  let iconColor = "text-amber-600"

  switch (type) {
    case "demandSpike":
      Icon = Zap
      bgColor = "bg-red-50 border-red-200 text-red-800"
      iconColor = "text-red-600"
      break
    case "supplyDisruption":
      Icon = Truck
      bgColor = "bg-blue-50 border-blue-200 text-blue-800"
      iconColor = "text-blue-600"
      break
    case "qualityIssue":
      Icon = AlertCircle
      bgColor = "bg-purple-50 border-purple-200 text-purple-800"
      iconColor = "text-purple-600"
      break
  }

  return (
    <Alert className={`mb-4 ${bgColor}`}>
      <Icon className={`h-4 w-4 ${iconColor}`} />
      <AlertTitle className="flex items-center">
        {description}
        <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-white/30">
          {roundsRemaining} {roundsRemaining === 1 ? "round" : "rounds"} remaining
        </span>
      </AlertTitle>
      <AlertDescription>{effect}</AlertDescription>
    </Alert>
  )
}

