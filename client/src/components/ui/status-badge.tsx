// Standardized status badge component
import { Badge } from "./badge";

type Status = "pending" | "confirmed" | "completed" | "cancelled" | "refunded" | "active" | "inactive" | "draft";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  confirmed: { label: "Confirmed", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  refunded: { label: "Refunded", variant: "destructive" },
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "secondary" },
  draft: { label: "Draft", variant: "outline" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}



