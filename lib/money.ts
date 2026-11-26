export function formatMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

export const BILLING_LABEL: Record<string, string> = {
  one_time: "one-time",
  per_event: "per event",
  per_semester: "per semester",
  per_year: "per year",
}

export const DEAL_STATUS_LABEL: Record<string, string> = {
  proposed: "Proposed",
  accepted: "Accepted",
  declined: "Declined",
  active: "Paid · in progress",
  completed: "Completed",
  cancelled: "Cancelled",
}
