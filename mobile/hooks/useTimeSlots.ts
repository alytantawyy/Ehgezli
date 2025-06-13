import { useState, useEffect } from 'react';
import { format, parse, isAfter, isSameDay } from 'date-fns';
import { TimeSlot } from '@/types/branch';
import { useBranchStore } from '@/store/branch-store';

/**
 * Custom hook for fetching time slots
 */
export const useTimeSlots = (branchId: number) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeForSlots, setSelectedTimeForSlots] = useState<string | null>(null);
  
  // Get the updateBranchTimeSlots and getBranchAvailability functions from the branch store
  const { updateBranchTimeSlots, getBranchAvailability } = useBranchStore();
  
  // Filter out time slots that are in the past if the date is today
  const filterPastTimeSlots = (slots: TimeSlot[], date: Date) => {
    const now = new Date();
    
    // Only filter if the selected date is today
    if (isSameDay(date, now)) {
      return slots.filter(slot => {
        const [hours, minutes] = slot.time.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(hours, minutes, 0, 0);
        return isAfter(slotTime, now);
      });
    }
    
    return slots;
  };

  // Format time for display (e.g., "14:30" -> "2:30 PM")
  const formatTimeForDisplay = (time: string): string => {
    try {
      // Parse the time string (HH:mm) into a Date object
      const timeDate = parse(time, 'HH:mm', new Date());
      // Format it in a more user-friendly way
      return format(timeDate, 'h:mm a'); // e.g., "2:30 PM"
    } catch (err) {
      console.error('Error formatting time:', err);
      return time; // Return original if parsing fails
    }
  };

  // Fetch time slots from the API
  const fetchTimeSlots = async (date: Date = selectedDate, selectedTimeParam?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Format date for API
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Store the selected time for later use
      const selectedTime = selectedTimeParam || '';
      
      // Log the API call for debugging
      console.log(`Fetching time slots for branch ${branchId} on ${formattedDate}`);
      console.log(`ud83dudd0d DEBUG: Date=${formattedDate}, Time=${selectedTime}, Selected Time=${selectedTime}`);
      
      // Call the API to get availability data through the branch store
      const response = await getBranchAvailability(branchId, formattedDate);
      
      if (!response) {
        throw new Error('Failed to fetch branch availability');
      }
      
      // Transform API response to TimeSlot array - ONLY include available slots
      const allSlots: TimeSlot[] = response.availableSlots
        .filter(slot => slot.isAvailable) // Only include available slots
        .map(slot => ({
          time: slot.time,
          isFull: false, // These are all available since we filtered
          displayTime: formatTimeForDisplay(slot.time),
          overlappingBookingsCount: slot.overlappingBookingsCount || 0
        }));
      
      // Filter out past time slots if the date is today
      const filteredSlots = filterPastTimeSlots(allSlots, date);
      
      // Sort slots by time
      filteredSlots.sort((a, b) => {
        const [aHours, aMinutes] = a.time.split(':').map(Number);
        const [bHours, bMinutes] = b.time.split(':').map(Number);
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
      });
      
      // Store the selected time for use in getRelevantTimeSlots
      if (selectedTime) {
        // Store the selected time in state for later use
        setSelectedTimeForSlots(selectedTime);
      }
      
      // Log the available slots for debugging
      console.log(`Available slots for branch ${branchId} on ${formattedDate}:`, 
        filteredSlots.map(s => s.time).join(', ') || 'None');
      
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
  
  // Ensure the selected time is in the available slots
  const ensureSelectedTimeIsAvailable = (
    availableSlots: TimeSlot[],
    selectedTime: string,
    date: Date
  ) => {
    // Only add the selected time if there are existing available slots
    if (availableSlots.length === 0) {
      console.log('⚠️ No available slots to add selected time to');
      return;
    }

    // Check if the selected time already exists in the available slots
    const timeExists = availableSlots.some(slot => slot.time === selectedTime);
    if (timeExists) {
      console.log(`✅ Selected time ${selectedTime} already exists in available slots`);
      return;
    }

    // Only add the selected time if it's within 30 minutes of an actual available slot
    // This prevents adding arbitrary times that might not be valid
    const selectedMinutes = timeToMinutes(selectedTime);
    const isCloseToAvailableSlot = availableSlots.some(slot => {
      const slotMinutes = timeToMinutes(slot.time);
      return Math.abs(selectedMinutes - slotMinutes) <= 30;
    });

    if (isCloseToAvailableSlot) {
      console.log(`✅ Adding selected time ${selectedTime} to available slots`);
      availableSlots.push({
        time: selectedTime,
        isFull: false,
        displayTime: formatTimeForDisplay(selectedTime),
        overlappingBookingsCount: 0
      });
      
      // Re-sort the array after adding the new time
      availableSlots.sort((a, b) => {
        const [aHours, aMinutes] = a.time.split(':').map(Number);
        const [bHours, bMinutes] = b.time.split(':').map(Number);
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
      });
    } else {
      console.log(`⚠️ Selected time ${selectedTime} is not close to any available slot`);
    }
  };

  // Helper function to convert time string to minutes since midnight
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Get relevant time slots based on user's selected time
  const getRelevantTimeSlots = (allSlots: TimeSlot[], targetTime?: string): TimeSlot[] => {
    // If no slots are available, return empty array
    if (allSlots.length === 0) {
      return [];
    }
    
    // Use the stored selected time if no target time is provided
    // Default to "17:30" (5:30 PM) if no time is selected
    const effectiveTargetTime = targetTime || selectedTimeForSlots || "17:30";
    
    // Convert target time to minutes since midnight for easier comparison
    const [targetHours, targetMinutes] = effectiveTargetTime.split(':').map(Number);
    const targetTotalMinutes = targetHours * 60 + targetMinutes;

    // Calculate the "distance" of each slot from the target time
    const slotsWithDistance = allSlots.map(slot => {
      const [slotHours, slotMinutes] = slot.time.split(':').map(Number);
      const slotTotalMinutes = slotHours * 60 + slotMinutes;
      
      // Prioritize slots at or after the target time by applying a penalty to earlier slots
      const timeOffset = slotTotalMinutes - targetTotalMinutes;
      const distance = timeOffset < 0 ? Math.abs(timeOffset) * 2 : Math.abs(timeOffset);
      
      return { ...slot, distance, timeOffset };
    });

    // Sort by distance from target time
    slotsWithDistance.sort((a, b) => a.distance - b.distance);

    // Get the 3 closest slots
    const closestSlots = slotsWithDistance.slice(0, 3);
    
    // Re-sort them chronologically before returning
    return closestSlots.sort((a, b) => {
      const [aHours, aMinutes] = a.time.split(':').map(Number);
      const [bHours, bMinutes] = b.time.split(':').map(Number);
      return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
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
    changeDate,
    formatTimeForDisplay,
    getRelevantTimeSlots,
    selectedTimeForSlots
  };
};
