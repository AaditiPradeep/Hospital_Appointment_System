import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { db } from "./firebaseConfig.js";

const appointments = [
    {
      doctorId: "doc101",
      doctorName: "Dr. Jane Smith",
      patientId: "pat001",
      patientName: "John",
      email: "john@example.com",
      age: "18",
      scheduledAt: new Date("2025-04-15T14:45:00Z").toISOString(),
      startedAt: new Date("2025-04-15T15:00:00Z").toISOString(),
      timeSlot: new Date("2025-04-15T15:00:00Z").toISOString(),
      appointmentDate: "2025-04-15",
      appointmentTime: "3:00 PM",
      status: "confirmed",
      duration: 30,
      priority: 1
    },
    {
      doctorId: "doc102",
      doctorName: "Dr. Rahul Verma",
      patientId: "pat002",
      patientName: "Aaditi",
      email: "aaditi@example.com",
      age: "20",
      scheduledAt: new Date("2025-04-15T09:00:00Z").toISOString(),
      startedAt: new Date("2025-04-15T09:05:00Z").toISOString(),
      timeSlot: new Date("2025-04-15T09:00:00Z").toISOString(),
      appointmentDate: "2025-04-15",
      appointmentTime: "9:00 AM",
      status: "confirmed",
      duration: 20,
      priority: 2
    },
    {
      doctorId: "doc101",
      doctorName: "Dr. Jane Smith",
      patientId: "pat003",
      patientName: "Ravi",
      email: "ravi@example.com",
      age: "25",
      scheduledAt: new Date("2025-04-15T10:30:00Z").toISOString(),
      startedAt: new Date("2025-04-15T10:45:00Z").toISOString(),
      timeSlot: new Date("2025-04-15T10:30:00Z").toISOString(),
      appointmentDate: "2025-04-15",
      appointmentTime: "10:30 AM",
      status: "delayed",
      duration: 30,
      priority: 1
    },
    {
      doctorId: "doc103",
      doctorName: "Dr. Ananya Roy",
      patientId: "pat004",
      patientName: "Sneha",
      email: "sneha@example.com",
      age: "30",
      scheduledAt: new Date("2025-04-14T11:00:00Z").toISOString(),
      startedAt: new Date("2025-04-14T11:00:00Z").toISOString(),
      timeSlot: new Date("2025-04-14T11:00:00Z").toISOString(),
      appointmentDate: "2025-04-14",
      appointmentTime: "11:00 AM",
      status: "confirmed",
      duration: 45,
      priority: 3
    },
    {
      doctorId: "doc104",
      doctorName: "Dr. Amit Patel",
      patientId: "pat005",
      patientName: "Priya",
      email: "priya@example.com",
      age: "35",
      scheduledAt: new Date("2025-04-13T16:00:00Z").toISOString(),
      startedAt: new Date("2025-04-13T16:10:00Z").toISOString(),
      timeSlot: new Date("2025-04-13T16:00:00Z").toISOString(),
      appointmentDate: "2025-04-13",
      appointmentTime: "4:00 PM",
      status: "delayed",
      duration: 20,
      priority: 2
    },
    {
      doctorId: "doc102",
      doctorName: "Dr. Rahul Verma",
      patientId: "pat006",
      patientName: "Meena",
      email: "meena@example.com",
      age: "22",
      scheduledAt: new Date("2025-04-12T13:00:00Z").toISOString(),
      startedAt: new Date("2025-04-12T13:00:00Z").toISOString(),
      timeSlot: new Date("2025-04-12T13:00:00Z").toISOString(),
      appointmentDate: "2025-04-12",
      appointmentTime: "1:00 PM",
      status: "confirmed",
      duration: 25,
      priority: 1
    },
    {
      doctorId: "doc103",
      doctorName: "Dr. Ananya Roy",
      patientId: "pat007",
      patientName: "Vikram",
      email: "vikram@example.com",
      age: "28",
      scheduledAt: new Date("2025-04-12T10:00:00Z").toISOString(),
      startedAt: new Date("2025-04-12T10:10:00Z").toISOString(),
      timeSlot: new Date("2025-04-12T10:00:00Z").toISOString(),
      appointmentDate: "2025-04-12",
      appointmentTime: "10:00 AM",
      status: "confirmed",
      duration: 30,
      priority: 2
    },
    {
      doctorId: "doc101",
      doctorName: "Dr. Jane Smith",
      patientId: "pat008",
      patientName: "Rohit",
      email: "rohit@example.com",
      age: "21",
      scheduledAt: new Date("2025-04-15T13:30:00Z").toISOString(),
      startedAt: new Date("2025-04-15T13:40:00Z").toISOString(),
      timeSlot: new Date("2025-04-15T13:30:00Z").toISOString(),
      appointmentDate: "2025-04-15",
      appointmentTime: "1:30 PM",
      status: "confirmed",
      duration: 20,
      priority: 1
    },
    {
      doctorId: "doc104",
      doctorName: "Dr. Amit Patel",
      patientId: "pat009",
      patientName: "Anjali",
      email: "anjali@example.com",
      age: "24",
      scheduledAt: new Date("2025-04-15T17:00:00Z").toISOString(),
      startedAt: new Date("2025-04-15T17:00:00Z").toISOString(),
      timeSlot: new Date("2025-04-15T17:00:00Z").toISOString(),
      appointmentDate: "2025-04-15",
      appointmentTime: "5:00 PM",
      status: "confirmed",
      duration: 30,
      priority: 2
    },
    {
      doctorId: "doc102",
      doctorName: "Dr. Rahul Verma",
      patientId: "pat010",
      patientName: "Tina",
      email: "tina@example.com",
      age: "27",
      scheduledAt: new Date("2025-04-13T08:30:00Z").toISOString(),
      startedAt: new Date("2025-04-13T08:45:00Z").toISOString(),
      timeSlot: new Date("2025-04-13T08:30:00Z").toISOString(),
      appointmentDate: "2025-04-13",
      appointmentTime: "8:30 AM",
      status: "confirmed",
      duration: 25,
      priority: 3
    }
  ];
  

async function pushAppointments() {
    const ref = collection(db, "appointments");
    for (const appointment of appointments) {
        await addDoc(ref, appointment);
        console.log("Added:", appointment);
    }
}

pushAppointments();

