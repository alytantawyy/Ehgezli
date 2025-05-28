import { useState } from 'react';
import { format } from 'date-fns';
import { fetchAvailableTimeSlots } from '@/app/utils/time-slots';

/**
 * Custom hook for fetching time slots
 */
export const useTimeSlots = () => {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch available time slots for a branch on a specific date
   */
  const fetchSlots = async (
    branchId: number,
    date: Date = new Date(),
    time: string = format(new Date(), 'HH:mm')
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Format date as YYYY-MM-DD
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Fetch available slots from backend
      const slots = await fetchAvailableTimeSlots(branchId, formattedDate, time);
      
      setAvailableSlots(slots);
      return slots;
    } catch (err) {
      console.error('❌ Error fetching time slots:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch time slots'));
      setAvailableSlots([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    availableSlots,
    loading,
    error,
    fetchSlots
  };
};
