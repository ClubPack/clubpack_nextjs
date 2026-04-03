"use client"

import { Button } from "@/components/ui/button"

export function PlanButton({
  planId,
  isCurrent,
  isPopular,
  label,
}: {
  planId: string
  isCurrent: boolean
  isPopular: boolean
  label: string
}) {
  return (
    <Button
      variant={isCurrent ? "secondary" : isPopular ? "default" : "outline"}
      className="w-full"
      disabled={isCurrent}
      onClick={() => {
        if (!isCurrent) {
          // TODO: integrate real Stripe checkout
          console.log("Change plan:", planId)
        }
      }}
    >
      {label}
    </Button>
  )
}
