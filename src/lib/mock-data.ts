export type Role = "patient" | "receptionist" | "doctor" | "admin";

export type AppointmentStatus =
  | "Pending" | "Confirmed" | "Waiting" | "In Consultation"
  | "Completed" | "Cancelled" | "No Show";

export type QueueStatus = "Waiting" | "Active" | "Completed" | "Delayed";

export interface Doctor {
  id: string; name: string; specialty: string; avatar: string;
  available: boolean; rating: number; nextSlot: string;
}
export interface Specialty { id: string; name: string; icon: string; }
export interface Appointment {
  id: string; patient: string; doctor: string; specialty: string;
  time: string; date: string; status: AppointmentStatus; reason: string;
}
export interface QueueEntry {
  id: string; ticket: string; patient: string; doctor: string;
  position: number; status: QueueStatus; etaMin: number; arrivedAt: string;
}
export interface Notification {
  id: string; title: string; body: string; time: string; type: "info" | "success" | "warning";
}

export const specialties: Specialty[] = [
  { id: "gen", name: "General Medicine", icon: "Stethoscope" },
  { id: "den", name: "Dentistry", icon: "Smile" },
  { id: "ped", name: "Pediatrics", icon: "Baby" },
  { id: "car", name: "Cardiology", icon: "HeartPulse" },
  { id: "der", name: "Dermatology", icon: "Sparkles" },
  { id: "lab", name: "Laboratory", icon: "FlaskConical" },
];

export const doctors: Doctor[] = [
  { id: "d1", name: "Dr. Amira Hassan", specialty: "General Medicine", avatar: "AH", available: true, rating: 4.9, nextSlot: "10:30 AM" },
  { id: "d2", name: "Dr. Marc Dubois", specialty: "Dentistry", avatar: "MD", available: true, rating: 4.8, nextSlot: "11:00 AM" },
  { id: "d3", name: "Dr. Sofia Chen", specialty: "Pediatrics", avatar: "SC", available: false, rating: 4.95, nextSlot: "2:15 PM" },
  { id: "d4", name: "Dr. Liam O'Connor", specialty: "Cardiology", avatar: "LO", available: true, rating: 4.85, nextSlot: "9:45 AM" },
  { id: "d5", name: "Dr. Priya Nair", specialty: "Dermatology", avatar: "PN", available: true, rating: 4.7, nextSlot: "1:30 PM" },
  { id: "d6", name: "Dr. Tomás Vega", specialty: "Laboratory", avatar: "TV", available: true, rating: 4.6, nextSlot: "Walk-in" },
];

export const appointments: Appointment[] = [
  { id: "a1", patient: "John Carter", doctor: "Dr. Amira Hassan", specialty: "General Medicine", time: "09:00", date: "Today", status: "Completed", reason: "Annual check-up" },
  { id: "a2", patient: "Maria Lopez", doctor: "Dr. Amira Hassan", specialty: "General Medicine", time: "09:30", date: "Today", status: "In Consultation", reason: "Follow-up" },
  { id: "a3", patient: "Ahmed Saleh", doctor: "Dr. Amira Hassan", specialty: "General Medicine", time: "10:00", date: "Today", status: "Waiting", reason: "Headache" },
  { id: "a4", patient: "Lina Park", doctor: "Dr. Marc Dubois", specialty: "Dentistry", time: "10:15", date: "Today", status: "Confirmed", reason: "Cleaning" },
  { id: "a5", patient: "Noah Smith", doctor: "Dr. Liam O'Connor", specialty: "Cardiology", time: "10:30", date: "Today", status: "Confirmed", reason: "ECG review" },
  { id: "a6", patient: "Yara Khalil", doctor: "Dr. Priya Nair", specialty: "Dermatology", time: "11:00", date: "Today", status: "Pending", reason: "Skin rash" },
  { id: "a7", patient: "John Carter", doctor: "Dr. Sofia Chen", specialty: "Pediatrics", time: "14:00", date: "Tomorrow", status: "Confirmed", reason: "Vaccination" },
];

export const queue: QueueEntry[] = [
  { id: "q1", ticket: "A-021", patient: "Maria Lopez", doctor: "Dr. Amira Hassan", position: 0, status: "Active", etaMin: 0, arrivedAt: "09:25" },
  { id: "q2", ticket: "A-022", patient: "Ahmed Saleh", doctor: "Dr. Amira Hassan", position: 1, status: "Waiting", etaMin: 8, arrivedAt: "09:48" },
  { id: "q3", ticket: "A-023", patient: "Lina Park", doctor: "Dr. Marc Dubois", position: 2, status: "Waiting", etaMin: 15, arrivedAt: "10:02" },
  { id: "q4", ticket: "A-024", patient: "Noah Smith", doctor: "Dr. Liam O'Connor", position: 3, status: "Delayed", etaMin: 25, arrivedAt: "10:10" },
  { id: "q5", ticket: "A-025", patient: "Yara Khalil", doctor: "Dr. Priya Nair", position: 4, status: "Waiting", etaMin: 32, arrivedAt: "10:18" },
];

export const notifications: Notification[] = [
  { id: "n1", title: "Appointment reminder", body: "Your visit with Dr. Hassan is in 30 min.", time: "5m ago", type: "info" },
  { id: "n2", title: "Queue updated", body: "You moved up — now #2 in line.", time: "12m ago", type: "success" },
  { id: "n3", title: "Doctor delayed", body: "Dr. O'Connor is running ~10 min behind.", time: "20m ago", type: "warning" },
];

export const analytics = {
  avgWait: 14,
  appointmentsToday: 87,
  cancellationRate: 6.2,
  satisfaction: 4.8,
  weekly: [
    { day: "Mon", appts: 62, wait: 12 },
    { day: "Tue", appts: 74, wait: 15 },
    { day: "Wed", appts: 81, wait: 18 },
    { day: "Thu", appts: 69, wait: 11 },
    { day: "Fri", appts: 92, wait: 21 },
    { day: "Sat", appts: 54, wait: 9 },
    { day: "Sun", appts: 31, wait: 7 },
  ],
  hourly: [
    { h: "8a", v: 12 }, { h: "9a", v: 24 }, { h: "10a", v: 38 },
    { h: "11a", v: 31 }, { h: "12p", v: 22 }, { h: "1p", v: 18 },
    { h: "2p", v: 27 }, { h: "3p", v: 34 }, { h: "4p", v: 29 }, { h: "5p", v: 19 },
  ],
  specialtyMix: [
    { name: "General", value: 38 },
    { name: "Dentistry", value: 22 },
    { name: "Pediatrics", value: 16 },
    { name: "Cardiology", value: 12 },
    { name: "Dermatology", value: 8 },
    { name: "Lab", value: 4 },
  ],
};

export const timeSlots = [
  "08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30",
];
