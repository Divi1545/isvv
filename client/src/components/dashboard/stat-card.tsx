import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
}

const StatCard = ({
  title,
  value,
  icon,
  iconColor,
  iconBgColor,
  trend,
  subtitle
}: StatCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconColor}>
              {icon === "dollar-sign" && (
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              )}
              {icon === "calendar" && (
                <>
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                  <line x1="16" x2="16" y1="2" y2="6"></line>
                  <line x1="8" x2="8" y1="2" y2="6"></line>
                  <line x1="3" x2="21" y1="10" y2="10"></line>
                </>
              )}
              {icon === "star" && (
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              )}
              {icon === "percent" && (
                <>
                  <line x1="19" x2="5" y1="5" y2="19"></line>
                  <circle cx="6.5" cy="6.5" r="2.5"></circle>
                  <circle cx="17.5" cy="17.5" r="2.5"></circle>
                </>
              )}
            </svg>
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-bold">{value}</h2>
          {trend && (
            <p className="text-xs flex items-center">
              <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
                  <polyline points={trend.isPositive ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                </svg>
                {trend.value}
              </span>
              {subtitle && <span className="text-muted-foreground ml-1">{subtitle}</span>}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;