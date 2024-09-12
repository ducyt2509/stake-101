export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = String(date.getFullYear()).slice(-2); // Get last two digits of the year

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}
