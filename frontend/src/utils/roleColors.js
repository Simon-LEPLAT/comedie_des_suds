/**
 * Returns the appropriate CSS class for a given user role
 * @param {string} role - The user role
 * @returns {string} - CSS class for the role
 */


/**
 * Returns the appropriate color for a given user role
 * @param {string} role - The user role
 * @param {number} opacity - Optional opacity level (0-1)
 * @returns {string} - CSS color for the role
 */
export const getRoleColor = (role, opacity = 1) => {
  if (!role) return opacity < 1 ? 'rgba(209, 213, 219, ' + opacity + ')' : '#D1D5DB';
  
  const roleColors = {
    'administrateur': opacity < 1 ? 'rgba(220, 38, 38, ' + opacity + ')' : '#DC2626', // red-600
    'artiste': opacity < 1 ? 'rgba(124, 58, 237, ' + opacity + ')' : '#7C3AED', // violet-600
    'billeterie': opacity < 1 ? 'rgba(37, 99, 235, ' + opacity + ')' : '#2563EB', // blue-600
    'permanence': opacity < 1 ? 'rgba(16, 185, 129, ' + opacity + ')' : '#10B981', // emerald-600
    'technique': opacity < 1 ? 'rgba(217, 119, 6, ' + opacity + ')' : '#D97706', // amber-600
    'regie': opacity < 1 ? 'rgba(236, 72, 153, ' + opacity + ')' : '#EC4899', // pink-600
    'communication': opacity < 1 ? 'rgba(236, 72, 153, ' + opacity + ')' : '#EC4899' // pink-600
  };
  
  return roleColors[role.toLowerCase()] || (opacity < 1 ? 'rgba(209, 213, 219, ' + opacity + ')' : '#D1D5DB');
};