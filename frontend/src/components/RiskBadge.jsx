export default function RiskBadge({ level }) {
  const colors = {
    HIGH: 'bg-red-500 text-white',
    MODERATE: 'bg-yellow-500 text-white',
    LOW: 'bg-green-500 text-white'
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[level] || 'bg-gray-500'}`}>
      {level}
    </span>
  )
}
