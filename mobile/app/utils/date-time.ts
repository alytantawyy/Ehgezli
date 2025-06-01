import { format } from 'date-fns';

/**
 * Gets smart default date and time based on current time of day
 * 
 * Logic:
 * - Morning to late morning (12:00 AM - 11:00 AM): Today, 1:00 PM
 * - Lunch time to early afternoon (11:00 AM - 3:00 PM): Today, current time + 2 hours
 * - Early evening to prime dinner (3:00 PM - 8:00 PM): Today, current time + 2 hours (capped at 9:00 PM)
 * - Late evening (8:00 PM - 10:00 PM): Today, fixed 9:00 PM
 * - Night (after 10:00 PM): Tomorrow, 1:00 PM
 */
export function getSmartDefaultDateTime() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  let defaultDate = new Date(now);
  let defaultTime = "";
  
  // Early morning to late morning (12:00 AM - 11:00 AM)
  if (currentHour < 11) {
    defaultTime = "13:00"; // 1:00 PM lunch time
  }
  
  // Lunch time to early afternoon (11:00 AM - 3:00 PM)
  else if (currentHour < 15) {
    const suggestedHour = Math.min(currentHour + 2, 18); // Cap at 6:00 PM
    defaultTime = `${suggestedHour}:${currentMinute.toString().padStart(2, '0')}`;
  }
  
  // Early evening to prime dinner time (3:00 PM - 8:00 PM)
  else if (currentHour < 20) {
    const suggestedHour = Math.min(currentHour + 2, 21); // Cap at 9:00 PM
    defaultTime = `${suggestedHour}:${currentMinute.toString().padStart(2, '0')}`;
  }
  
  // Late evening (8:00 PM - 10:00 PM)
  else if (currentHour < 22) {
    defaultTime = "21:00"; // Fixed 9:00 PM as last reasonable dinner time
  }
  
  // Night (after 10:00 PM)
  else {
    // Set date to tomorrow
    defaultDate.setDate(defaultDate.getDate() + 1);
    defaultTime = "13:00"; // 1:00 PM lunch time tomorrow
  }
  
  // Round minutes up to nearest 30 minutes for better UX
  if (defaultTime !== "13:00" && defaultTime !== "21:00") {
    const [hours, minutes] = defaultTime.split(':').map(Number);
    
    // Calculate minutes to next half hour (ceiling)
    let roundedMinutes;
    if (minutes <= 30) {
      roundedMinutes = 30;
    } else {
      roundedMinutes = 0;
      // Move to next hour
      defaultTime = `${hours + 1}:00`;
    }
    
    // Only update if we're rounding to 30 minutes
    if (roundedMinutes === 30) {
      defaultTime = `${hours}:${roundedMinutes}`;
    }
  }
  
  return {
    date: defaultDate,
    time: defaultTime
  };
}

/**
 * Gets the minimum selectable date (today)
 * This ensures users can't select dates in the past
 */
export function getMinSelectableDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day
  return today;
}

/**
 * Formats a time string (HH:MM) to a more readable format (h:MM AM/PM)
 */
export function formatDisplayTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
