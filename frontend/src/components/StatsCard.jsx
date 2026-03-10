import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({
  icon: Icon,
  label,
  value,
  change,
  changeLabel,
  iconBg = 'bg-primary-100',
  iconColor = 'text-primary-600',
}) {
  const isPositive = change > 0;
  const isNeutral = change === undefined || change === null;

  return (
    <div className="card flex items-start gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {Icon && <Icon className={`h-6 w-6 ${iconColor}`} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        {!isNeutral && (
          <div className="mt-1 flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span
              className={`text-xs font-medium ${
                isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {isPositive ? '+' : ''}
              {change}%
            </span>
            {changeLabel && (
              <span className="text-xs text-slate-400">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
