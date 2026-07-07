import type { BaziChart, Gender } from '@/types/bazi'
import type { QuestionCategory } from '@/configs/questions'

export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      readings: {
        Row: {
          id: string
          user_id: string
          created_at: string
          category: QuestionCategory
          question: string
          gender: Gender
          solar_date: string
          chart: BaziChart
          interpretation: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          category: QuestionCategory
          question: string
          gender: Gender
          solar_date: string
          chart: BaziChart
          interpretation: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          category?: QuestionCategory
          question?: string
          gender?: Gender
          solar_date?: string
          chart?: BaziChart
          interpretation?: string
        }
        Relationships: [
          {
            foreignKeyName: 'readings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
