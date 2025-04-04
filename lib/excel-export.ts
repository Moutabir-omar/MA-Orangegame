import * as XLSX from "xlsx"
import type { PlayerAction } from "./websocket-service"

// Define types for export data
export type PlayerStats = {
  round: number
  role: string
  inventory: number
  backlog: number
  incomingOrder: number
  outgoingOrder: number
  incomingShipment: number
  roundCost: number
  cumulativeCost: number
  timestamp: string
}

export type GameExportData = {
  gameId: string
  startTime: string
  endTime: string
  totalRounds: number
  players: {
    role: string
    name: string
    totalCost: number
    averageInventory: number
    averageBacklog: number
    serviceLevel: number
  }[]
  rounds: {
    round: number
    demand: number
    scenario?: string
  }[]
  playerStats: PlayerStats[]
  playerActions: PlayerAction[]
}

// Function to generate Excel file from game data
export function generateExcelFile(data: GameExportData): Blob {
  // Create a new workbook
  const workbook = XLSX.utils.book_new()

  // Apply some basic styles
  const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFE0E0E0" } } }
  const titleStyle = { font: { bold: true, sz: 14 }, fill: { fgColor: { rgb: "FFCCCCCC" } } }
  
  // 1. FIRST: Add Weekly Details worksheet to prioritize week-by-week data
  // Sort stats by round and then by role for better readability
  const sortedStats = [...data.playerStats].sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round
    return a.role.localeCompare(b.role)
  })

  // Sort actions by timestamp for chronological order
  const sortedActions = [...data.playerActions].sort((a, b) => a.timestamp - b.timestamp)
  
  // Add Weekly Details worksheet as the primary sheet
  const weeklyDetailsData = [
    ["ORANGE JUICE GAME - DETAILED WEEKLY DATA ANALYSIS"],
    ["Game ID: " + data.gameId],
    [""],
    [
      "Week",
      "Role",
      "Inventory",
      "Backlog",
      "Incoming Order",
      "Outgoing Order",
      "Incoming Shipment",
      "Weekly Cost (MAD)",
      "Cumulative Cost (MAD)",
      "Service Level (%)",
    ],
  ]

  // Calculate additional metrics for each week/player combination
  sortedStats.forEach((stat) => {
    // Calculate service level for this specific week (1 if no backlog, 0 if backlog)
    const weekServiceLevel = stat.backlog > 0 ? 0 : 100;
    
    // Find the corresponding action (order) for this round and role
    const orderAction = sortedActions.find(
      action => action.round === stat.round && 
      action.role === stat.role && 
      action.action === "placeOrder"
    );
    
    weeklyDetailsData.push([
      stat.round.toString(),
      stat.role.toUpperCase(),
      stat.inventory.toString(),
      stat.backlog.toString(),
      stat.incomingOrder.toString(),
      orderAction ? orderAction.value.toString() : "N/A",
      stat.incomingShipment.toString(),
      (+stat.roundCost).toFixed(2),
      (+stat.cumulativeCost).toFixed(2),
      weekServiceLevel.toString() + "%",
    ]);
  });

  // Add weekly details worksheet (FIRST SHEET)
  const weeklyDetailsWorksheet = XLSX.utils.aoa_to_sheet(weeklyDetailsData);
  
  // Apply column widths
  const weeklyDetailsColWidths = [
    { wch: 10 }, // A - Week
    { wch: 15 }, // B - Role
    { wch: 10 }, // C - Inventory
    { wch: 10 }, // D - Backlog
    { wch: 15 }, // E - Incoming Order
    { wch: 15 }, // F - Outgoing Order
    { wch: 18 }, // G - Incoming Shipment
    { wch: 15 }, // H - Round Cost
    { wch: 20 }, // I - Cumulative Cost
    { wch: 15 }, // J - Service Level
  ];
  weeklyDetailsWorksheet['!cols'] = weeklyDetailsColWidths;
  
  XLSX.utils.book_append_sheet(workbook, weeklyDetailsWorksheet, "Weekly Data");

  // 2. SECOND: Add Weekly Cost Breakdown
  const costBreakdownData = [
    ["ORANGE JUICE GAME - WEEKLY COST BREAKDOWN"],
    ["Game ID: " + data.gameId],
    [""],
    ["Week", "Role", "Inventory Cost", "Backlog Cost", "Total Weekly Cost", "% Inventory Cost", "% Backlog Cost", "Cumulative Cost"]
  ];
  
  // Calculate cost breakdown for each week and role
  sortedStats.forEach((stat) => {    
    // Calculate individual cost components
    const inventoryCost = stat.inventory * 5; // 5 MAD per case in inventory
    const backlogCost = stat.backlog * 10;   // 10 MAD per case in backlog
    const totalWeeklyCost = inventoryCost + backlogCost;
    
    // Calculate percentages
    const inventoryCostPct = totalWeeklyCost > 0 ? (inventoryCost / totalWeeklyCost) * 100 : 0;
    const backlogCostPct = totalWeeklyCost > 0 ? (backlogCost / totalWeeklyCost) * 100 : 0;
    
    costBreakdownData.push([
      stat.round.toString(),
      stat.role.toUpperCase(),
      inventoryCost.toFixed(2),
      backlogCost.toFixed(2),
      totalWeeklyCost.toFixed(2),
      inventoryCostPct.toFixed(1) + "%",
      backlogCostPct.toFixed(1) + "%",
      stat.cumulativeCost.toFixed(2)
    ]);
  });
  
  // Add cost breakdown worksheet (SECOND SHEET)
  const costBreakdownWorksheet = XLSX.utils.aoa_to_sheet(costBreakdownData);
  
  // Apply column widths
  const costBreakdownColWidths = [
    { wch: 10 }, // A - Week
    { wch: 15 }, // B - Role
    { wch: 15 }, // C - Inventory Cost
    { wch: 15 }, // D - Backlog Cost
    { wch: 18 }, // E - Total Weekly Cost
    { wch: 16 }, // F - % Inventory Cost
    { wch: 16 }, // G - % Backlog Cost
    { wch: 18 }, // H - Cumulative Cost
  ];
  costBreakdownWorksheet['!cols'] = costBreakdownColWidths;
  
  XLSX.utils.book_append_sheet(workbook, costBreakdownWorksheet, "Weekly Costs");

  // 3. THIRD: Add the Round Comparison worksheet for week-by-week role comparison
  const roundComparisonData = [
    ["ORANGE JUICE GAME - ROUND-BY-ROUND COMPARISON"],
    ["Game ID: " + data.gameId],
    [""],
    ["Week", "Customer Demand", "Retailer", "Wholesaler", "Distributor", "Manufacturer"],
    ["", "Demand", "Inv", "BL", "Cost", "Order", "Inv", "BL", "Cost", "Order", "Inv", "BL", "Cost", "Order", "Inv", "BL", "Cost", "Order"],
  ];
  
  // Prepare data for each round
  for (let round = 1; round <= data.totalRounds; round++) {
    const demand = data.rounds.find(r => r.round === round)?.demand || "N/A";
    const row = [round.toString(), demand.toString()];
    
    // For each role, add their stats for this round
    ["retailer", "wholesaler", "distributor", "manufacturer"].forEach(role => {
      const roleStat = data.playerStats.find(stat => stat.round === round && stat.role.toLowerCase() === role);
      const roleOrder = data.playerActions.find(
        action => action.round === round && 
        action.role.toLowerCase() === role && 
        action.action === "placeOrder"
      );
      
      if (roleStat) {
        row.push(
          roleStat.inventory.toString(),
          roleStat.backlog.toString(),
          (+roleStat.roundCost).toFixed(2),
          roleOrder ? roleOrder.value.toString() : "N/A"
        );
      } else {
        row.push("N/A", "N/A", "N/A", "N/A");
      }
    });
    
    roundComparisonData.push(row);
  }
  
  // Add round comparison worksheet
  const roundComparisonWorksheet = XLSX.utils.aoa_to_sheet(roundComparisonData);
  
  // Apply column widths - more columns here for the detailed comparison
  const roundComparisonColWidths = Array(18).fill(0).map(() => ({ wch: 10 }));
  roundComparisonWorksheet['!cols'] = roundComparisonColWidths;
  
  XLSX.utils.book_append_sheet(workbook, roundComparisonWorksheet, "Week-by-Week Comparison");

  // 4. FOURTH: Add Weekly Inventory Flow worksheet
  const inventoryFlowData = [
    ["ORANGE JUICE GAME - WEEKLY INVENTORY FLOW ANALYSIS"],
    ["Game ID: " + data.gameId],
    [""],
    ["Week", "Role", "Beginning Inventory", "Incoming Shipment", "Outgoing Order", "Backlog Filled", "Ending Inventory", "Net Change"],
  ];
  
  // Calculate inventory flow for each week and role
  sortedStats.forEach((stat, index) => {
    // Find previous week stats for the same role
    const prevWeekStat = sortedStats.find(s => 
      s.round === stat.round - 1 && 
      s.role === stat.role
    );
    
    // Calculate inventory flow metrics
    const beginningInventory = prevWeekStat ? prevWeekStat.inventory : (stat.role.toLowerCase() === "retailer" ? 12 : 12);
    const incomingShipment = stat.incomingShipment;
    const outgoingOrder = stat.outgoingOrder;
    const backlogFilled = prevWeekStat && prevWeekStat.backlog > 0 ? 
      Math.min(prevWeekStat.backlog, beginningInventory + incomingShipment) : 0;
    const endingInventory = stat.inventory;
    const netChange = endingInventory - beginningInventory;
    
    inventoryFlowData.push([
      stat.round.toString(),
      stat.role.toUpperCase(),
      beginningInventory.toString(),
      incomingShipment.toString(),
      outgoingOrder.toString(),
      backlogFilled.toString(),
      endingInventory.toString(),
      netChange > 0 ? "+" + netChange.toString() : netChange.toString(),
    ]);
  });
  
  // Add inventory flow worksheet
  const inventoryFlowWorksheet = XLSX.utils.aoa_to_sheet(inventoryFlowData);
  
  // Apply column widths
  const inventoryFlowColWidths = [
    { wch: 10 }, // A - Week
    { wch: 15 }, // B - Role
    { wch: 18 }, // C - Beginning Inventory
    { wch: 18 }, // D - Incoming Shipment
    { wch: 15 }, // E - Outgoing Order
    { wch: 15 }, // F - Backlog Filled
    { wch: 15 }, // G - Ending Inventory
    { wch: 12 }, // H - Net Change
  ];
  inventoryFlowWorksheet['!cols'] = inventoryFlowColWidths;
  
  XLSX.utils.book_append_sheet(workbook, inventoryFlowWorksheet, "Weekly Inventory Flow");

  // After all weekly data sheets, add the summary and other reference sheets
  
  // 5. Game Summary worksheet (moved down in the sheet order)
  const summaryData = [
    ["Orange Juice Distribution Game - Results"],
    [""],
    ["Game Information"],
    ["Game ID", data.gameId],
    ["Start Time", new Date(data.startTime).toLocaleString()],
    ["End Time", new Date(data.endTime).toLocaleString()],
    ["Total Rounds", data.totalRounds.toString()],
    [""],
    ["Player Results"],
    ["Role", "Name", "Total Cost (MAD)", "Avg. Inventory", "Avg. Backlog", "Service Level (%)"],
  ]

  // Add player summary data
  data.players.forEach((player) => {
    summaryData.push([
      player.role.toUpperCase(),
      player.name,
      player.totalCost.toFixed(2),
      player.averageInventory.toFixed(2),
      player.averageBacklog.toFixed(2),
      player.serviceLevel.toString() + "%",
    ])
  })

  // Add summary worksheet (now 5th in order)
  const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData)
  
  // Apply column widths
  const summaryColWidths = [
    { wch: 15 }, // A
    { wch: 20 }, // B
    { wch: 15 }, // C
    { wch: 15 }, // D
    { wch: 15 }, // E
    { wch: 15 }, // F
  ]
  summaryWorksheet['!cols'] = summaryColWidths
  
  // Add some styling
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Game Summary")

  // 6. Add a Supply Chain Performance worksheet
  const performanceData = [
    ["Orange Juice Game - Supply Chain Performance Analysis"],
    [""],
    ["Round", "Retailer Order", "Wholesaler Order", "Distributor Order", "Manufacturer Order", "Customer Demand", "Bullwhip Ratio"],
  ]

  // Group actions by round
  const roundMap = new Map()
  const demandByRound = new Map()
  
  // Get demand values for each round
  data.rounds.forEach(round => {
    demandByRound.set(round.round, round.demand)
  })
  
  // Collect orders by role and round
  sortedActions.forEach(action => {
    if (action.action === "placeOrder") {
      if (!roundMap.has(action.round)) {
        roundMap.set(action.round, {
          retailer: null,
          wholesaler: null,
          distributor: null,
          manufacturer: null
        })
      }
      
      const roundData = roundMap.get(action.round)
      roundData[action.role.toLowerCase()] = action.value
    }
  })
  
  // Calculate standard deviation and mean for customer demand
  let demandValues = []
  for (let i = 1; i <= data.totalRounds; i++) {
    if (demandByRound.has(i)) {
      demandValues.push(demandByRound.get(i))
    }
  }
  
  // Calculate bullwhip ratios
  for (let i = 1; i <= data.totalRounds; i++) {
    if (roundMap.has(i)) {
      const roundData = roundMap.get(i)
      const row = [i.toString()]
      
      // Add orders for each role
      row.push(roundData.retailer?.toString() || "N/A")
      row.push(roundData.wholesaler?.toString() || "N/A")
      row.push(roundData.distributor?.toString() || "N/A")
      row.push(roundData.manufacturer?.toString() || "N/A")
      
      // Add demand
      const demand = demandByRound.get(i)
      row.push(demand?.toString() || "N/A")
      
      // Calculate simple bullwhip ratio for this round
      const allOrders = [roundData.retailer, roundData.wholesaler, roundData.distributor, roundData.manufacturer].filter(x => x !== null)
      if (allOrders.length > 0 && demand) {
        const avgOrder = allOrders.reduce((sum, val) => sum + val, 0) / allOrders.length
        const bullwhipRatio = (avgOrder / demand).toFixed(2)
        row.push(bullwhipRatio)
      } else {
        row.push("N/A")
      }
      
      performanceData.push(row)
    }
  }
  
  // Add performance worksheet
  const performanceWorksheet = XLSX.utils.aoa_to_sheet(performanceData)
  
  // Apply column widths
  const performanceColWidths = [
    { wch: 10 }, // A
    { wch: 15 }, // B
    { wch: 18 }, // C
    { wch: 18 }, // D
    { wch: 18 }, // E
    { wch: 18 }, // F
    { wch: 15 }, // G
  ]
  performanceWorksheet['!cols'] = performanceColWidths
  
  XLSX.utils.book_append_sheet(workbook, performanceWorksheet, "Supply Chain Performance")

  // 7. Round Data worksheet
  const roundsData = [
    ["Orange Juice Game - Round Data"],
    [""],
    ["Round", "Customer Demand", "Active Scenario"]
  ]

  // Add round data
  data.rounds.forEach((round) => {
    roundsData.push([round.round.toString(), round.demand.toString(), round.scenario || "None"])
  })

  // Add rounds worksheet
  const roundsWorksheet = XLSX.utils.aoa_to_sheet(roundsData)
  
  // Apply column widths
  const roundsColWidths = [
    { wch: 10 }, // A
    { wch: 15 }, // B
    { wch: 30 }, // C
  ]
  roundsWorksheet['!cols'] = roundsColWidths
  
  XLSX.utils.book_append_sheet(workbook, roundsWorksheet, "Round Data")

  // 8. Create a combined player stats worksheet
  const allStatsData = [
    ["Orange Juice Game - All Player Statistics"],
    [""],
    [
      "Round",
      "Role",
      "Inventory",
      "Backlog",
      "Incoming Order",
      "Outgoing Order",
      "Incoming Shipment",
      "Round Cost (MAD)",
      "Cumulative Cost (MAD)",
      "Timestamp",
    ],
  ]

  // Add all player stats data
  sortedStats.forEach((stat) => {
    allStatsData.push([
      stat.round.toString(),
      stat.role.toUpperCase(),
      stat.inventory.toString(),
      stat.backlog.toString(),
      stat.incomingOrder.toString(),
      stat.outgoingOrder.toString(),
      stat.incomingShipment.toString(),
      (+stat.roundCost).toFixed(2),
      (+stat.cumulativeCost).toFixed(2),
      new Date(stat.timestamp).toLocaleString(),
    ])
  })

  // Add combined player stats worksheet
  const allStatsWorksheet = XLSX.utils.aoa_to_sheet(allStatsData)
  
  // Apply column widths
  const allStatsColWidths = [
    { wch: 10 }, // A
    { wch: 15 }, // B
    { wch: 10 }, // C
    { wch: 10 }, // D
    { wch: 15 }, // E
    { wch: 15 }, // F
    { wch: 18 }, // G
    { wch: 15 }, // H
    { wch: 20 }, // I
    { wch: 20 }, // J
  ]
  allStatsWorksheet['!cols'] = allStatsColWidths
  
  XLSX.utils.book_append_sheet(workbook, allStatsWorksheet, "All Player Stats")

  // 9. Create Player Actions worksheet
  const actionsData = [
    ["Orange Juice Game - Player Actions"],
    [""],
    ["Round", "Role", "Action", "Value", "Timestamp"]
  ]

  // Add player actions data
  sortedActions.forEach((action) => {
    actionsData.push([
      action.round.toString(),
      action.role.toUpperCase(),
      action.action,
      action.value.toString(),
      new Date(action.timestamp).toLocaleString(),
    ])
  })

  // Add player actions worksheet
  const actionsWorksheet = XLSX.utils.aoa_to_sheet(actionsData)
  
  // Apply column widths
  const actionsColWidths = [
    { wch: 10 }, // A
    { wch: 15 }, // B
    { wch: 15 }, // C
    { wch: 10 }, // D
    { wch: 20 }, // E
  ]
  actionsWorksheet['!cols'] = actionsColWidths
  
  XLSX.utils.book_append_sheet(workbook, actionsWorksheet, "Player Actions")

  // 10. For each role, create a separate worksheet
  const uniqueRoles = Array.from(new Set(data.playerStats.map(stat => stat.role)))
  
  // For each role, create a separate worksheet
  uniqueRoles.forEach(role => {
    const roleStats = data.playerStats.filter(stat => stat.role === role)
    
    const statsData = [
      [`Orange Juice Game - ${role.toUpperCase()} Statistics`],
      [""],
      [
        "Round",
        "Inventory",
        "Backlog",
        "Incoming Order",
        "Outgoing Order",
        "Incoming Shipment",
        "Round Cost (MAD)",
        "Cumulative Cost (MAD)",
        "Timestamp",
      ],
    ]

    // Add player stats data
    roleStats.forEach((stat) => {
      statsData.push([
        stat.round.toString(),
        stat.inventory.toString(),
        stat.backlog.toString(),
        stat.incomingOrder.toString(),
        stat.outgoingOrder.toString(),
        stat.incomingShipment.toString(),
        (+stat.roundCost).toFixed(2),
        (+stat.cumulativeCost).toFixed(2),
        new Date(stat.timestamp).toLocaleString(),
      ])
    })

    // Add player stats worksheet
    const statsWorksheet = XLSX.utils.aoa_to_sheet(statsData)
    
    // Apply column widths
    const statsColWidths = [
      { wch: 10 }, // A
      { wch: 10 }, // B
      { wch: 10 }, // C
      { wch: 15 }, // D
      { wch: 15 }, // E
      { wch: 18 }, // F
      { wch: 15 }, // G
      { wch: 20 }, // H
      { wch: 20 }, // I
    ]
    statsWorksheet['!cols'] = statsColWidths
    
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, `${role.toUpperCase()} Stats`)
  })

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
}

// Function to download Excel file
export function downloadExcelFile(data: GameExportData, filename = "orange-juice-game-results.xlsx") {
  const blob = generateExcelFile(data)
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}

// Function to prepare game data for export
export function prepareGameDataForExport(
  gameId: string,
  players: any[],
  rounds: number,
  demandHistory: number[],
  inventoryHistory: number[],
  backlogHistory: number[],
  orderHistory: number[],
  costHistory: number[],
  playerActions: PlayerAction[],
): GameExportData {
  const startTime = new Date(Date.now() - rounds * 60000).toLocaleString() // Estimate start time
  const endTime = new Date().toLocaleString()

  // Prepare player stats
  const playerStats: PlayerStats[] = []
  for (let i = 0; i < rounds; i++) {
    playerStats.push({
      round: i + 1,
      role: "Retailer", // Assuming single player for now
      inventory: inventoryHistory[i] || 0,
      backlog: backlogHistory[i] || 0,
      incomingOrder: demandHistory[i] || 0,
      outgoingOrder: orderHistory[i] || 0,
      incomingShipment: i >= 3 ? orderHistory[i - 3] || 0 : 0,
      roundCost: costHistory[i] || 0,
      cumulativeCost: costHistory.slice(0, i + 1).reduce((sum, cost) => sum + cost, 0),
      timestamp: new Date(Date.now() - (rounds - i) * 60000).toLocaleString(), // Estimate timestamp
    })
  }

  // Prepare player summary
  const playerSummaries = players.map((player) => {
    return {
      role: player.role,
      name: player.name,
      totalCost: costHistory.reduce((sum, cost) => sum + cost, 0),
      averageInventory: inventoryHistory.reduce((sum, inv) => sum + inv, 0) / inventoryHistory.length,
      averageBacklog: backlogHistory.reduce((sum, bl) => sum + bl, 0) / backlogHistory.length,
      serviceLevel: Math.round((1 - backlogHistory.filter((bl) => bl > 0).length / backlogHistory.length) * 100),
    }
  })

  // Prepare round data
  const roundData = demandHistory.map((demand, index) => {
    return {
      round: index + 1,
      demand,
    }
  })

  return {
    gameId,
    startTime,
    endTime,
    totalRounds: rounds,
    players: playerSummaries,
    rounds: roundData,
    playerStats,
    playerActions,
  }
}

