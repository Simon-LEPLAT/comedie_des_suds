export const getRoleColor = (role) => {
  switch (role.toLowerCase()) {
    case 'administrateur':
      return 'bg-red-100 text-red-800';
    case 'artiste':
      return 'bg-blue-100 text-blue-800';
    case 'permanence':
      return 'bg-green-100 text-green-800';
    case 'billeterie':
      return 'bg-purple-100 text-purple-800';
    case 'regie':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};