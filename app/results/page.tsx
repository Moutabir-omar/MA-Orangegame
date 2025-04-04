"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Download, Home } from "lucide-react"
import { GameChart } from "@/components/game-chart"

export default function ResultsPage() {
  // Sample data for demonstration
  const gameResults = {
    totalRounds: 50,
    players: [
      { role: "Retailer", name: "John Doe (You)", cost: 245.5, rank: 2 },
      { role: "Wholesaler", name: "Alice Smith", cost: 312.0, rank: 3 },
      { role: "Distributor", name: "Robert Johnson", cost: 198.5, rank: 1 },
      { role: "Manufacturer", name: "AI Player", cost: 356.0, rank: 4 },
    ],
    totalCost: 1112.0,
    bullwhipEffect: "High",
    demandVariability: 3.2,
    orderVariability: {
      retailer: 5.8,
      wholesaler: 8.4,
      distributor: 12.1,
      manufacturer: 15.3,
    },
    inventoryTrend: [
      12, 10, 8, 12, 15, 18, 14, 10, 6, 4, 8, 12, 16, 14, 10, 8, 6, 10, 14, 16, 12, 8, 4, 2, 6, 10, 14, 16, 12, 8, 6,
      10, 14, 16, 12, 8, 4, 2, 6, 10, 14, 16, 12, 8, 6, 10, 14, 16, 12, 8,
    ],
    demandHistory: [
      4, 5, 3, 6, 4, 5, 7, 3, 4, 5, 6, 4, 3, 5, 7, 6, 4, 5, 3, 6, 4, 5, 7, 3, 4, 5, 6, 4, 3, 5, 7, 6, 4, 5, 3, 6, 4, 5,
      7, 3, 4, 5, 6, 4, 3, 5, 7, 6, 4, 5,
    ],
    orderHistory: {
      retailer: [
        4, 6, 8, 5, 3, 7, 9, 4, 2, 6, 8, 10, 5, 3, 7, 9, 4, 2, 6, 8, 10, 5, 3, 7, 9, 4, 2, 6, 8, 10, 5, 3, 7, 9, 4, 2,
        6, 8, 10, 5, 3, 7, 9, 4, 2, 6, 8, 10, 5, 3,
      ],
      wholesaler: [
        5, 7, 10, 12, 6, 4, 8, 11, 13, 7, 5, 9, 12, 14, 8, 6, 10, 13, 15, 9, 7, 11, 14, 16, 10, 8, 12, 15, 17, 11, 9,
        13, 16, 18, 12, 10, 14, 17, 19, 13, 11, 15, 18, 20, 14, 12, 16, 19, 21, 15,
      ],
      distributor: [
        6, 8, 11, 14, 17, 7, 5, 9, 12, 15, 18, 8, 6, 10, 13, 16, 19, 9, 7, 11, 14, 17, 20, 10, 8, 12, 15, 18, 21, 11, 9,
        13, 16, 19, 22, 12, 10, 14, 17, 20, 23, 13, 11, 15, 18, 21, 24, 14, 12, 16,
      ],
      manufacturer: [
        7, 9, 12, 15, 18, 21, 8, 6, 10, 13, 16, 19, 22, 9, 7, 11, 14, 17, 20, 23, 10, 8, 12, 15, 18, 21, 24, 11, 9, 13,
        16, 19, 22, 25, 12, 10, 14, 17, 20, 23, 26, 13, 11, 15, 18, 21, 24, 27, 14, 12,
      ],
    },
    costBreakdown: {
      inventory: 65,
      backlog: 35,
    },
    serviceLevel: 82,
    efficiencyScore: 68,
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Link href="/" className="inline-flex items-center text-orange-600 hover:text-orange-700">
              <Home className="mr-2 h-5 w-5" />
              Return to Home
            </Link>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Results
            </Button>
          </div>

          <Card className="shadow-lg mb-8">
            <CardHeader className="text-center border-b pb-6">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                <Award className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-3xl text-orange-700">Game Results</CardTitle>
              <CardDescription>Orange Juice Distribution Game - 50 Rounds Completed</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Player Rankings</h3>
                  <div className="space-y-3">
                    {gameResults.players.map((player, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-orange-800 ${
                              player.rank === 1
                                ? "bg-yellow-300"
                                : player.rank === 2
                                  ? "bg-gray-300"
                                  : player.rank === 3
                                    ? "bg-orange-300"
                                    : "bg-gray-100"
                            }`}
                          >
                            {player.rank}
                          </div>
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-gray-500">{player.role}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{player.cost.toFixed(2)} MAD</div>
                          <div className="text-xs text-gray-500">Total Cost</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Supply Chain Performance</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-white border">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-gray-500">Total Supply Chain Cost</div>
                        <Badge variant="outline" className="text-lg font-mono">
                          {gameResults.totalCost.toFixed(2)} MAD
                        </Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">Bullwhip Effect</div>
                        <Badge variant="destructive" className="bg-red-500">
                          {gameResults.bullwhipEffect}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-white border">
                        <div className="text-sm font-medium mb-2">Service Level</div>
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                {gameResults.serviceLevel}%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                            <div
                              style={{ width: `${gameResults.serviceLevel}%` }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-white border">
                        <div className="text-sm font-medium mb-2">Efficiency Score</div>
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                {gameResults.efficiencyScore}%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                            <div
                              style={{ width: `${gameResults.efficiencyScore}%` }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Bullwhip Effect Visualization</CardTitle>
                    <CardDescription>Order variability amplification across the supply chain</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <div className="h-full">
                      <GameChart
                        data={[
                          gameResults.demandHistory.slice(0, 20),
                          gameResults.orderHistory.retailer.slice(0, 20),
                          gameResults.orderHistory.wholesaler.slice(0, 20),
                          gameResults.orderHistory.distributor.slice(0, 20),
                          gameResults.orderHistory.manufacturer.slice(0, 20),
                        ]}
                        color={["#9CA3AF", "#3B82F6", "#F97316", "#8B5CF6", "#EF4444"]}
                        type="line"
                        maxValue={30}
                        labels={Array.from({ length: 20 }, (_, i) => i + 1)}
                        title="Order Patterns Across Supply Chain"
                        yLabel="Order Quantity"
                        xLabel="Round"
                        legend={["Customer Demand", "Retailer", "Wholesaler", "Distributor", "Manufacturer"]}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Variability Amplification</CardTitle>
                    <CardDescription>Standard deviation / mean for each supply chain role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex flex-col justify-center">
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Customer Demand</span>
                            <span className="font-medium">{gameResults.demandVariability.toFixed(1)}x</span>
                          </div>
                          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gray-400 rounded-full"
                              style={{ width: `${Math.min(100, (gameResults.demandVariability / 20) * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Retailer Orders</span>
                            <span className="font-medium">{gameResults.orderVariability.retailer.toFixed(1)}x</span>
                          </div>
                          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-400 rounded-full"
                              style={{ width: `${Math.min(100, (gameResults.orderVariability.retailer / 20) * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Wholesaler Orders</span>
                            <span className="font-medium">{gameResults.orderVariability.wholesaler.toFixed(1)}x</span>
                          </div>
                          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-400 rounded-full"
                              style={{
                                width: `${Math.min(100, (gameResults.orderVariability.wholesaler / 20) * 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Distributor Orders</span>
                            <span className="font-medium">{gameResults.orderVariability.distributor.toFixed(1)}x</span>
                          </div>
                          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-400 rounded-full"
                              style={{
                                width: `${Math.min(100, (gameResults.orderVariability.distributor / 20) * 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Manufacturer Orders</span>
                            <span className="font-medium">{gameResults.orderVariability.manufacturer.toFixed(1)}x</span>
                          </div>
                          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-400 rounded-full"
                              style={{
                                width: `${Math.min(100, (gameResults.orderVariability.manufacturer / 20) * 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="inventory">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="inventory">Inventory Trends</TabsTrigger>
                  <TabsTrigger value="orders">Order Patterns</TabsTrigger>
                  <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
                  <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value="inventory" className="p-4 border rounded-lg mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Inventory Fluctuation</h3>
                      <div className="h-64">
                        <GameChart
                          data={gameResults.inventoryTrend.slice(0, 20)}
                          color="#22C55E"
                          type="line"
                          maxValue={20}
                          labels={Array.from({ length: 20 }, (_, i) => i + 1)}
                          title="Inventory Levels Over Time"
                          yLabel="Cases"
                          xLabel="Round"
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Inventory Management Analysis</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">Average Inventory Level</div>
                            <div className="text-lg font-bold">
                              {(
                                gameResults.inventoryTrend.reduce((a, b) => a + b, 0) /
                                gameResults.inventoryTrend.length
                              ).toFixed(1)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            Your average inventory level indicates{" "}
                            {gameResults.inventoryTrend.reduce((a, b) => a + b, 0) / gameResults.inventoryTrend.length >
                            10
                              ? "excessive stock holding, which increases costs."
                              : gameResults.inventoryTrend.reduce((a, b) => a + b, 0) /
                                    gameResults.inventoryTrend.length <
                                  5
                                ? "insufficient buffer stock, risking stockouts."
                                : "a good balance between cost and service level."}
                          </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">Inventory Variability</div>
                            <div className="text-lg font-bold">
                              {calculateVariability(gameResults.inventoryTrend).toFixed(2)}x
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {calculateVariability(gameResults.inventoryTrend) > 0.5
                              ? "High inventory variability indicates reactive ordering patterns and poor forecasting."
                              : "Low inventory variability shows consistent management and good planning."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="orders" className="p-4 border rounded-lg mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Order vs. Demand Comparison</h3>
                      <div className="h-64">
                        <GameChart
                          data={[
                            gameResults.demandHistory.slice(0, 20),
                            gameResults.orderHistory.retailer.slice(0, 20),
                          ]}
                          color={["#9CA3AF", "#3B82F6"]}
                          type="line"
                          maxValue={15}
                          labels={Array.from({ length: 20 }, (_, i) => i + 1)}
                          title="Your Orders vs. Customer Demand"
                          yLabel="Cases"
                          xLabel="Round"
                          legend={["Customer Demand", "Your Orders"]}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Order Strategy Analysis</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">Order Amplification Ratio</div>
                            <div className="text-lg font-bold">
                              {(gameResults.orderVariability.retailer / gameResults.demandVariability).toFixed(2)}x
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {gameResults.orderVariability.retailer / gameResults.demandVariability > 1.5
                              ? "You significantly amplified demand variability in your orders, contributing to the bullwhip effect."
                              : "You maintained relatively stable ordering patterns relative to demand, helping minimize the bullwhip effect."}
                          </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">Order Strategy Classification</div>
                            <Badge
                              className={
                                gameResults.orderVariability.retailer / gameResults.demandVariability > 2
                                  ? "bg-red-100 text-red-800"
                                  : gameResults.orderVariability.retailer / gameResults.demandVariability > 1.2
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                              }
                            >
                              {gameResults.orderVariability.retailer / gameResults.demandVariability > 2
                                ? "Reactive"
                                : gameResults.orderVariability.retailer / gameResults.demandVariability > 1.2
                                  ? "Inconsistent"
                                  : "Stable"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {gameResults.orderVariability.retailer / gameResults.demandVariability > 2
                              ? "Reactive ordering leads to large swings in inventory and higher costs."
                              : gameResults.orderVariability.retailer / gameResults.demandVariability > 1.2
                                ? "Your ordering pattern shows some inconsistency but avoids extreme reactions."
                                : "Your stable ordering approach helps minimize costs and stabilize the supply chain."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="costs" className="p-4 border rounded-lg mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Cost Breakdown</h3>
                      <div className="h-64 flex items-center justify-center">
                        <div className="relative w-48 h-48">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke="#22C55E"
                              strokeWidth="20"
                              strokeDasharray={2 * Math.PI * 40}
                              strokeDashoffset={2 * Math.PI * 40 * (1 - gameResults.costBreakdown.inventory / 100)}
                              transform="rotate(-90 50 50)"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke="#EF4444"
                              strokeWidth="20"
                              strokeDasharray={2 * Math.PI * 40}
                              strokeDashoffset={2 * Math.PI * 40 * (1 - gameResults.costBreakdown.backlog / 100)}
                              strokeDasharray={2 * Math.PI * 40 * (gameResults.costBreakdown.inventory / 100)}
                              transform="rotate(0 50 50)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <div className="text-sm font-medium">Cost Distribution</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center gap-8 mt-4">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded-sm mr-2"></div>
                          <div className="text-sm">
                            <div>Inventory Cost</div>
                            <div className="font-medium">{gameResults.costBreakdown.inventory}%</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-red-500 rounded-sm mr-2"></div>
                          <div className="text-sm">
                            <div>Backlog Cost</div>
                            <div className="font-medium">{gameResults.costBreakdown.backlog}%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Cost Analysis</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">Cost Efficiency Rating</div>
                            <Badge
                              className={
                                gameResults.players[0].rank === 1
                                  ? "bg-green-100 text-green-800"
                                  : gameResults.players[0].rank === 2
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }
                            >
                              {gameResults.players[0].rank === 1
                                ? "Excellent"
                                : gameResults.players[0].rank === 2
                                  ? "Good"
                                  : "Needs Improvement"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {gameResults.players[0].rank === 1
                              ? "Your cost management was excellent, achieving the lowest total cost in the supply chain."
                              : gameResults.players[0].rank === 2
                                ? "Your cost management was good, but there's room for improvement in inventory optimization."
                                : "Your cost management needs improvement. Focus on reducing inventory variability and backlog."}
                          </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">Cost Structure Analysis</div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {gameResults.costBreakdown.inventory > gameResults.costBreakdown.backlog
                              ? "Your costs were dominated by inventory holding costs, suggesting you maintained excessive safety stock."
                              : "Your costs were dominated by backlog costs, suggesting you frequently ran out of inventory to fulfill orders."}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Optimal strategy: Balance inventory levels to minimize both holding costs and stockouts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="p-4 border rounded-lg mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Performance Metrics</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">Service Level</div>
                            <div className="text-lg font-bold">{gameResults.serviceLevel}%</div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${gameResults.serviceLevel}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            {gameResults.serviceLevel > 90
                              ? "Excellent service level, indicating very few stockouts."
                              : gameResults.serviceLevel > 75
                                ? "Good service level, but some customer orders were delayed."
                                : "Poor service level with frequent stockouts and customer dissatisfaction."}
                          </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">Bullwhip Contribution</div>
                            <div className="text-lg font-bold">
                              {(
                                (gameResults.orderVariability.retailer / gameResults.demandVariability - 1) *
                                100
                              ).toFixed(0)}
                              %
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-orange-500 h-2.5 rounded-full"
                              style={{
                                width: `${Math.min(100, (gameResults.orderVariability.retailer / gameResults.demandVariability - 1) * 100)}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            {gameResults.orderVariability.retailer / gameResults.demandVariability > 1.5
                              ? "Your ordering patterns significantly amplified demand variability, contributing to the bullwhip effect."
                              : "You maintained relatively stable ordering patterns, helping minimize the bullwhip effect."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Performance Comparison</h3>
                      <div className="h-64">
                        <GameChart
                          data={[[245.5, 312, 198.5, 356]]}
                          color={["#F97316"]}
                          type="bar"
                          maxValue={400}
                          labels={["Retailer", "Wholesaler", "Distributor", "Manufacturer"]}
                          title="Total Cost by Role"
                          yLabel="Cost (MAD)"
                          xLabel="Supply Chain Role"
                        />
                      </div>
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="font-medium mb-2">Performance Insights</div>
                        <p className="text-sm text-gray-600">
                          The distributor achieved the lowest cost by maintaining consistent order patterns and optimal
                          inventory levels. Your performance as retailer was second best, with room for improvement in
                          order variability management.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" asChild>
                <Link href="/game">Play Again</Link>
              </Button>
              <Button asChild className="bg-orange-500 hover:bg-orange-600">
                <Link href="/">Return to Home</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Outcomes</CardTitle>
              <CardDescription>Key takeaways from this simulation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-medium mb-2">The Bullwhip Effect</h3>
                  <p className="text-sm text-gray-600">
                    Your simulation demonstrated how small fluctuations in customer demand (±
                    {gameResults.demandVariability.toFixed(1)}x) were amplified throughout the supply chain, reaching ±
                    {gameResults.orderVariability.manufacturer.toFixed(1)}x at the manufacturer level. This is a classic
                    example of the bullwhip effect, where information distortion and delayed responses cause
                    increasingly larger swings in inventory and orders.
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-medium mb-2">Inventory Management Strategies</h3>
                  <p className="text-sm text-gray-600">
                    The distributor achieved the lowest cost by maintaining consistent order patterns and optimal
                    inventory levels. This demonstrates how smoothing orders and maintaining buffer stock can reduce
                    overall costs and improve supply chain efficiency.
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-medium mb-2">Information Sharing</h3>
                  <p className="text-sm text-gray-600">
                    Limited visibility of demand across the supply chain contributed to inefficiencies. In real-world
                    applications, improved information sharing and collaborative forecasting can significantly reduce
                    the bullwhip effect and lower costs.
                  </p>
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
function calculateVariability(data) {
  if (data.length <= 1) return 1

  const mean = data.reduce((a, b) => a + b, 0) / data.length
  if (mean === 0) return 1

  const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length
  return Math.sqrt(variance) / mean
}

