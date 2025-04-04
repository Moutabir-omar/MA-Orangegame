export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          code: string
          name: string
          status: string
          round: number
          total_rounds: number
          round_time: number
          current_demand: number
          created_at: string
          updated_at: string
          game_type: string
          ai_difficulty: string
          enable_scenarios: boolean
          scenario_active: Json | null
        }
        Insert: {
          id?: string
          code?: string
          name: string
          status?: string
          round?: number
          total_rounds?: number
          round_time?: number
          current_demand?: number
          created_at?: string
          updated_at?: string
          game_type?: string
          ai_difficulty?: string
          enable_scenarios?: boolean
          scenario_active?: Json | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          status?: string
          round?: number
          total_rounds?: number
          round_time?: number
          current_demand?: number
          created_at?: string
          updated_at?: string
          game_type?: string
          ai_difficulty?: string
          enable_scenarios?: boolean
          scenario_active?: Json | null
        }
      }
      players: {
        Row: {
          id: string
          game_id: string
          name: string
          role: string
          is_ai: boolean
          inventory: number
          backlog: number
          connected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          name: string
          role: string
          is_ai?: boolean
          inventory?: number
          backlog?: number
          connected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          name?: string
          role?: string
          is_ai?: boolean
          inventory?: number
          backlog?: number
          connected?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      player_actions: {
        Row: {
          id: string
          game_id: string
          player_id: string
          round: number
          action: string
          value: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          round: number
          action: string
          value: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          round?: number
          action?: string
          value?: number
          created_at?: string
        }
      }
      game_rounds: {
        Row: {
          id: string
          game_id: string
          round: number
          demand: number
          scenario: string | null
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          round: number
          demand: number
          scenario?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          round?: number
          demand?: number
          scenario?: string | null
          created_at?: string
        }
      }
      player_stats: {
        Row: {
          id: string
          game_id: string
          player_id: string
          round: number
          inventory: number
          backlog: number
          incoming_order: number
          outgoing_order: number
          incoming_shipment: number
          round_cost: number
          cumulative_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          round: number
          inventory: number
          backlog: number
          incoming_order: number
          outgoing_order: number
          incoming_shipment: number
          round_cost: number
          cumulative_cost: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          round?: number
          inventory?: number
          backlog?: number
          incoming_order?: number
          outgoing_order?: number
          incoming_shipment?: number
          round_cost?: number
          cumulative_cost?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

