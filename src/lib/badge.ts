export const getStatusBadgeClasses = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    case 'accepted':
      return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
    case 'confirmed':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'in_progress':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    case 'completed':
      return 'bg-green-500/10 text-green-400 border border-green-500/20';
    case 'pending': // for bookings
      return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    case 'rejected':
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  }
}
