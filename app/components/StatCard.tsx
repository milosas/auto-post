interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export default function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {icon && (
        <div className="mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-3">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}
