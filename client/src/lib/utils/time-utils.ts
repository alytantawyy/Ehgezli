// Helper functions for time and date calculations
import { addHours, isSameDay, isWithinInterval } from "date-fns";
import { BookingWithDetails } from "server/db/schema";

export const getCurrentTimeSlot = () => {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  // Round up to next 30 minutes
  if (minutes > 0 && minutes < 30) {
    minutes = 30;
  } else if (minutes > 30) {
    minutes = 0;
    hours = hours + 1;
  }
  // Handle hour wrapping
  if (hours >= 24) {
    hours = 0;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const generateTimeSlots = (openingTime: string, closingTime: string, bookingDate?: Date) => {
  if (!openingTime || !closingTime) return [];

  const slots = [];
  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);

  let startHour = openHour;
  let startMinute = openMinute;

  const now = new Date();
  if (bookingDate &&
    bookingDate.getDate() === now.getDate() &&
    bookingDate.getMonth() === now.getMonth() &&
    bookingDate.getFullYear() === now.getFullYear()) {
    startHour = now.getHours();
    startMinute = now.getMinutes();

    if (startMinute > 30) {
      startHour += 1;
      startMinute = 0;
    } else if (startMinute > 0) {
      startMinute = 30;
    }

    if (startHour < openHour || (startHour === openHour && startMinute < openMinute)) {
      startHour = openHour;
      startMinute = openMinute;
    }
  }

  let lastSlotHour = closeHour;
  let lastSlotMinute = closeMinute;

  // Don't allow bookings in the last hour
  lastSlotHour = lastSlotHour - 1;

  for (let hour = startHour; hour <= lastSlotHour; hour++) {
    for (let minute of [0, 30]) {
      if (hour === openHour && minute < openMinute) continue;
      if (hour === lastSlotHour && minute > lastSlotMinute) continue;
      if (hour === startHour && minute < startMinute) continue;

      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

export const getBookingsForSeatCalculation = (
  bookings: BookingWithDetails[] | undefined,
  selectedDate: Date | undefined,
  selectedBranch: string
) => {
  return bookings?.filter(booking => {
    if (booking.completed) return false;
    if (selectedDate && !isSameDay(booking.date, selectedDate)) return false;
    if (selectedBranch !== "all" && booking.branchId.toString() !== selectedBranch) return false;
    return true;
  }) || [];
};

export const getAvailableSeats = (
  selectedTimeStr: string,
  selectedDate: Date | undefined,
  bookings: BookingWithDetails[] | undefined,
  selectedBranch: string,
  totalSeats: number
) => {
  if (!selectedDate || !selectedTimeStr || selectedTimeStr === "all") return "-";

  const relevantBookings = getBookingsForSeatCalculation(bookings, selectedDate, selectedBranch);
  const [hours, minutes] = selectedTimeStr.split(':').map(Number);
  const selectedDateTime = new Date(selectedDate);
  selectedDateTime.setHours(hours, minutes, 0, 0);

  const isCurrentTimeSlot = selectedTimeStr === getCurrentTimeSlot();
  const isToday = isSameDay(selectedDateTime, new Date());

  const takenSeats = relevantBookings.reduce((sum, booking) => {
    if (!booking.confirmed) return sum;
    if (isCurrentTimeSlot && isToday && booking.arrived && !booking.completed) {
      return sum + booking.partySize;
    }

    const bookingStart = new Date(booking.date);
    const bookingEnd = addHours(bookingStart, 2);

    if (isWithinInterval(selectedDateTime, { start: bookingStart, end: bookingEnd })) {
      if (!isCurrentTimeSlot || !booking.arrived) {
        return sum + booking.partySize;
      }
    }

    return sum;
  }, 0);

  return totalSeats - takenSeats;
};

export const formatElapsedTime = (startTime: string) => {
  const start = new Date(startTime);
  const now = new Date();
  const hours = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60));
  const minutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60)) % 60;
  return `${hours}h ${minutes}m`;
};
