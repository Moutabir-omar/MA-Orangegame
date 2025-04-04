export function handleSupabaseError(error: any, message: string) {
  console.error(`${message}:`, error)
  return {
    title: "Error",
    description: `${message}. Please try again.`,
    variant: "destructive" as const,
  }
}

