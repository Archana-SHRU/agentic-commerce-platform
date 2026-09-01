import { TrendingUp, TrendingDown } from 'lucide-react'

interface DashboardCardProps {
  title: string
  value: string | number
  description?: string
  trend?: number
  icon?: React.ReactNode
  valueFormat?: 'currency' | 'number' | 'percentage'
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  description,
  trend,
  icon,
  valueFormat = 'number',
}) => {
  const isPositive = trend !== undefined && trend > 0

  const formatted =
    valueFormat === 'currency' ? `₹${value}` : valueFormat === 'percentage' ? `${value}%` : value

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatted}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>

      {trend !== undefined && (
        <div className={`flex items-center gap-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span className="text-sm font-medium">
            {isPositive ? '+' : ''}{trend}% from last month
          </span>
        </div>
      )}
    </div>
  )
}
