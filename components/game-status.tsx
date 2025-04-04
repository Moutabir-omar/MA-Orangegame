import { Badge } from "@/components/ui/badge"
import { Clock, Users, AlertTriangle } from "lucide-react"

interface GameStatusProps {
  status: string
  round: number
  totalRounds: number
  playerCount: number
  scenarioActive?: boolean
}

export function GameStatus({ status, round, totalRounds, playerCount, scenarioActive }: GameStatusProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={status === "waiting" ? "outline" : status === "in_progress" ? "default" : "secondary"}
        className={status === "in_progress" ? "bg-green-500" : status === "completed" ? "bg-blue-500" : ""}
      >
        {status === "waiting" ? "Waiting for Players" : status === "in_progress" ? "In Progress" : "Completed"}
      </Badge>

      <Badge variant="outline" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Round {round}/{totalRounds}
      </Badge>

      <Badge variant="outline" className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        {playerCount}/4 Players
      </Badge>

      {scenarioActive && (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Scenario Active
        </Badge>
      )}
    </div>
  )
}

