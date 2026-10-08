export const STATUS_LABELS: Record<string, string> = {
  pending: "Wacht op betaling", paid: "Betaald", production: "In productie", shipped: "Verzonden",
  delivered: "Bezorgd", cancelled: "Geannuleerd", refunded: "Terugbetaald", failed: "Mislukt",
};

export const STATUS_TONE: Record<string, string> = {
  paid: "bg-primary/15 text-primary", production: "bg-accent text-accent-foreground",
  shipped: "bg-secondary text-secondary-foreground", delivered: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/15 text-destructive", refunded: "bg-destructive/15 text-destructive",
  failed: "bg-destructive/15 text-destructive", pending: "bg-muted text-muted-foreground",
};
