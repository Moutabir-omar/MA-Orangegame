import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"

interface DecisionImpactProps {
  currentOrder: number
  averageOrder: number
  currentDemand: number
  averageDemand: number
  inventory: number
  backlog: number
  impactAnalysis: {
    inventoryImpact: "increase" | "decrease" | "stable"
    costImpact: "increase" | "decrease" | "stable"
    serviceImpact: "increase" | "decrease" | "stable"
    bullwhipImpact: "increase" | "decrease" | "stable"
  }
}

export function DecisionImpact({
  currentOrder,
  averageOrder,
  currentDemand,
  averageDemand,
  inventory,
  backlog,
  impactAnalysis,
}: DecisionImpactProps) {
  // Helper function to render impact indicator
  const renderImpact = (impact: "increase" | "decrease" | "stable", positiveIsGood = true) => {
    if (impact === "increase") {
      return (
        <Badge className={positiveIsGood ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
          <ArrowUpIcon className="h-3 w-3 mr-1" />
          Increase
        </Badge>
      )
    } else if (impact === "decrease") {
      return (
        <Badge className={!positiveIsGood ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
          <ArrowDownIcon className="h-3 w-3 mr-1" />
          Decrease
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          <MinusIcon className="h-3 w-3 mr-1" />
          Stable
        </Badge>
      )
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Decision Impact Analysis</CardTitle>
        <CardDescription>How your current order affects key metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <div className="font-medium">Current Order vs Average</div>
              <div className="text-gray-500">
                {currentOrder} vs {averageOrder.toFixed(1)} (avg)
              </div>
            </div>
            <Badge
              className={
                currentOrder > averageOrder * 1.2
                  ? "bg-amber-100 text-amber-800"
                  : currentOrder < averageOrder * 0.8
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
              }
            >
              {currentOrder > averageOrder * 1.2
                ? "Higher than usual"
                : currentOrder < averageOrder * 0.8
                  ? "Lower than usual"
                  : "Normal range"}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm">
              <div className="font-medium">Order vs Demand Ratio</div>
              <div className="text-gray-500">
                {currentOrder / currentDemand > 0 ? (currentOrder / currentDemand).toFixed(1) : 0}x current demand
              </div>
            </div>
            <Badge
              className={
                currentOrder > currentDemand * 1.5
                  ? "bg-red-100 text-red-800"
                  : currentOrder < currentDemand * 0.7
                    ? "bg-amber-100 text-amber-800"
                    : "bg-green-100 text-green-800"
              }
            >
              {currentOrder > currentDemand * 1.5
                ? "Overordering"
                : currentOrder < currentDemand * 0.7
                  ? "Underordering"
                  : "Balanced"}
            </Badge>
          </div>

          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium mb-3">Projected Impact</h4>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Inventory Levels</span>
                {renderImpact(impactAnalysis.inventoryImpact, inventory < 10)}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Operating Costs</span>
                {renderImpact(impactAnalysis.costImpact, false)}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Service Level</span>
                {renderImpact(impactAnalysis.serviceImpact, true)}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Bullwhip Effect</span>
                {renderImpact(impactAnalysis.bullwhipImpact, false)}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium mb-2">Recommendation</h4>
            <p className="text-sm text-gray-600">
              {currentOrder > currentDemand * 1.5 && inventory > 10
                ? "Consider reducing your order. Your inventory is sufficient and high orders contribute to the bullwhip effect."
                : currentOrder < currentDemand * 0.7 && (inventory < 5 || backlog > 0)
                  ? "Consider increasing your order to avoid stockouts and improve service level."
                  : "Your current order is well-balanced with demand and inventory levels."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

