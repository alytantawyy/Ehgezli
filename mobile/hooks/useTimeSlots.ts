import { useState, useEffect } from 'react';
import { format, parse, isAfter } from 'date-fns';
import { TimeSlot } from '@/types/branch';
import { getBranchAvailability } from '@/api/branch';
import { useBranchStore } from '@/store/branch-store';

/**
 * Custom hook for fetching time slots
 */
export const useTimeSlots = (branchId: number) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Get the updateBranchTimeSlots function from the branch store
  const { updateBranchTimeSlots } = useBranchStore();
  
  // Fetch time slots from the API
  const fetchTimeSlots = async (date: Date = selectedDate) => {
    setLoading(true);
    setError(null);
    
    try {
      // Format date for API
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Call the API to get availability data
      const response = await getBranchAvailability(branchId, formattedDate);
      
      // Transform API response to TimeSlot array
      const allSlots: TimeSlot[] = response.availableSlots.map(slot => ({
        time: slot.time,
        isFull: !slot.isAvailable
      }));
      
      // Filter out past time slots if the selected date is today
      const filteredSlots = filterPastTimeSlots(allSlots, date);
      
      // Update local state
      setTimeSlots(filteredSlots);
      
      // Update branch store with time slots
      // This will trigger availability calculation and branch sorting
      updateBranchTimeSlots(branchId, filteredSlots);
      
      return filteredSlots;
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setError('Failed to fetch available time slots');
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Filter out past time slots if the date is today
  const filterPastTimeSlots = (slots: TimeSlot[], date: Date): TimeSlot[] => {
    const now = new Date();
    const isToday = format(now, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    
    if (!isToday) {
      // If not today, return all slots
      return slots;
    }
    
    // If it's today, filter out past time slots
    return slots.filter(slot => {
      // Parse the time slot
      const [hours, minutes] = slot.time.split(':').map(Number);
      
      // Create a date object for the time slot
      const slotDate = new Date();
      slotDate.setHours(hours, minutes, 0, 0);
      
      // Return true if the slot is in the future
      return isAfter(slotDate, now);
    });
  };
  
  // Change the selected date and fetch new time slots
  const changeDate = async (date: Date) => {
    setSelectedDate(date);
    return fetchTimeSlots(date);
  };
  
  return {
    timeSlots,
    loading,
    error,
    selectedDate,
    fetchTimeSlots,
    changeDate
  };
};
