import { useState } from 'react';
import { format } from 'date-fns';
import { fetchAvailableTimeSlots } from '@/app/utils/time-slots';
import { TimeSlot } from '@/types/branch';
import { useBranchStore } from '@/store/branch-store';

/**
 * Custom hook for fetching time slots
 */
export const useTimeSlots = () => {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
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
      
      // Create TimeSlot objects with availability information
      const timeSlotObjects = slots.map(slotTime => ({
        time: slotTime,
        isFull: false // These slots are available, so they're not full
      }));
      
      // Update time slots
      setTimeSlots(timeSlotObjects);
      
      // Update the branch store with time slot data
      const updateBranchStore = useBranchStore.getState();
      updateBranchStore.updateBranchTimeSlots(branchId, timeSlotObjects);
      
      return slots;
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { availableSlots, timeSlots, loading, error, fetchSlots };
};
