"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50 to-orange-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center">
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
                  className="text-white"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-orange-600">Orange Juice Game</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold text-orange-800 mb-4">Orange Juice Distribution Game</h1>
          <p className="text-lg text-gray-700 mb-8">
            Master the supply chain, minimize costs, and avoid the bullwhip effect in this engaging simulation game.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600">
              <Link href="/create-game">Create Game</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              <Link href="/join-game">Join Game</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-700">How to Play</CardTitle>
              <CardDescription>Learn the basics of the Orange Juice Distribution Game</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc pl-5">
                <li>Take on one of four roles: Retailer, Wholesaler, Distributor, or Manufacturer</li>
                <li>Manage inventory and fulfill orders each round</li>
                <li>Balance inventory costs (5 MAD/case) and backorder costs (10 MAD/case)</li>
                <li>Anticipate future demand to optimize your supply chain</li>
                <li>Minimize total costs across all 50 rounds to win</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant="link"
                className="text-orange-600"
                onClick={() => {
                  alert(
                    "Game Rules: The Orange Juice Game simulates a supply chain with 4 roles. Each player manages inventory, fulfills orders, and places new orders each round. The goal is to minimize total costs over all rounds.",
                  )
                }}
              >
                View detailed rules
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-orange-700">Supply Chain Roles</CardTitle>
              <CardDescription>Each role has unique challenges and responsibilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-800 font-bold">
                    R
                  </div>
                  <div>
                    <h3 className="font-medium">Retailer</h3>
                    <p className="text-sm text-gray-600">Interfaces directly with customer demand</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-300 flex items-center justify-center text-orange-800 font-bold">
                    W
                  </div>
                  <div>
                    <h3 className="font-medium">Wholesaler</h3>
                    <p className="text-sm text-gray-600">Receives orders from retailer and orders from distributor</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-400 flex items-center justify-center text-orange-800 font-bold">
                    D
                  </div>
                  <div>
                    <h3 className="font-medium">Distributor</h3>
                    <p className="text-sm text-gray-600">Acts as intermediary between wholesaler and manufacturer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-orange-800 font-bold">
                    M
                  </div>
                  <div>
                    <h3 className="font-medium">Manufacturer</h3>
                    <p className="text-sm text-gray-600">Produces orange juice based on upstream orders</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="bg-orange-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="mb-4 md:mb-0">© 2025 Orange Juice Distribution Game</p>
            <div className="flex gap-4">
              <Link href="#" className="text-orange-200 hover:text-white">
                About
              </Link>
              <Link href="#" className="text-orange-200 hover:text-white">
                Contact
              </Link>
              <Link href="#" className="text-orange-200 hover:text-white">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

