import { db } from "./firebaseConfig.js";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { lockSlot } from "./locks.js";

// Function to send alert notification for rescheduled or deleted appointment
async function sendAppointmentAlert(email, message) {
    try {
        const notificationRef = collection(db, "Notifications");
        await addDoc(notificationRef, {
            email: email,
            message: message,
            read: false,
            timestamp: new Date()
        });
        console.log("Notification sent to:", email);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
}

// Function to log the deleted appointment's user email
async function logDeletedAppointment(email, doctorName, appointmentDate, appointmentTime) {
    try {
        const deletedAppointmentsRef = collection(db, "DeletedAppointments");
        await addDoc(deletedAppointmentsRef, {
            email: email,
            doctorName: doctorName,
            appointmentDate: appointmentDate,
            appointmentTime: appointmentTime,
            deletedAt: new Date() // Log the time of deletion
        });
        console.log("Deleted appointment logged for:", email);
    } catch (error) {
        console.error("Error logging deleted appointment:", error);
    }
}

// Load available doctors dynamically
async function loadDoctors() {
    const doctorDropdown = document.getElementById("doctorName");
    const doctorRef = collection(db, "DoctorAvailability");
    const doctorsSnapshot = await getDocs(doctorRef);

    doctorsSnapshot.forEach(doc => {
        const doctor = doc.data();
        const option = document.createElement("option");
        option.value = doctor.doctorName;
        option.textContent = doctor.doctorName;
        doctorDropdown.appendChild(option);
    });
}

// Load available time slots based on selected doctor and date
async function loadTimeSlots() {
    const doctorName = document.getElementById("doctorName").value;
    const appointmentDate = document.getElementById("appointmentDate").value.trim(); // Ensure trimmed format
    const timeDropdown = document.getElementById("appointmentTime");
    timeDropdown.innerHTML = "";

    if (!doctorName || !appointmentDate) {
        return;
    }

    console.log("Selected Date:", appointmentDate); // Debugging log

    const doctorRef = collection(db, "DoctorAvailability");
    const q = query(doctorRef, where("doctorName", "==", doctorName), where("availableDates", "array-contains", appointmentDate));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const timeSlots = snapshot.docs[0].data().timeSlots;
        timeSlots.forEach(time => {
            const option = document.createElement("option");
            option.value = time;
            option.textContent = time;
            timeDropdown.appendChild(option);
        });
    } else {
        const option = document.createElement("option");
        option.textContent = "No available slots";
        timeDropdown.appendChild(option);
    }
}

// Find the next available time slot for the doctor on the given date
async function findNextAvailableSlot(doctorName, appointmentDate, currentTime = null) {
    const doctorAvailabilityRef = collection(db, "DoctorAvailability");
    const q = query(doctorAvailabilityRef, where("doctorName", "==", doctorName), where("availableDates", "array-contains", appointmentDate));
    const doctorSnapshot = await getDocs(q);

    if (doctorSnapshot.empty) {
        return null; // Doctor not available on that date
    }

    const doctorData = doctorSnapshot.docs[0].data();
    const availableSlots = [...doctorData.timeSlots].sort(); // Create a copy and sort by time

    const bookedSlotsQuery = query(collection(db, "Appointments"),
        where("doctorName", "==", doctorName),
        where("appointmentDate", "==", appointmentDate));
    const bookedSlotsSnapshot = await getDocs(bookedSlotsQuery);

    const bookedTimes = bookedSlotsSnapshot.docs.map(doc => doc.data().appointmentTime);

    // If currentTime is provided, find a slot that comes AFTER the current time
    if (currentTime) {
        let foundCurrent = false;
        for (const slot of availableSlots) {
            // Once we've found our current time, start looking for available slots
            if (slot === currentTime) {
                foundCurrent = true;
                continue;
            }
            
            // Look for the next available slot after the current time
            if (foundCurrent && !bookedTimes.includes(slot)) {
                return slot;
            }
        }
    }
    
    // If no currentTime is provided or no slots found after currentTime,
    // just find the first available slot
    for (const slot of availableSlots) {
        if (!bookedTimes.includes(slot)) {
            return slot;
        }
    }
    
    return null; // No available slots
}

// Function to book an appointment
async function bookAppointment() {
    const doctorName = document.getElementById("doctorName").value;
    const appointmentDate = document.getElementById("appointmentDate").value.trim();
    const appointmentTime = document.getElementById("appointmentTime").value;
    const patientName = document.getElementById("patientName").value;
    const email = document.getElementById("email").value;
    const age = document.getElementById("age").value;
    const priority = parseInt(document.getElementById("priority").value);
    const statusMessage = document.getElementById("statusMessage");

    if (!doctorName || !appointmentDate || !appointmentTime || !patientName || !email || !age) {
        statusMessage.textContent = "Please fill all fields!";
        return;
    }

    try {
        // Mutex Lock to prevent duplicate bookings
        const isLocked = await lockSlot(doctorName, appointmentDate, appointmentTime, priority);
        if (!isLocked && priority === 0) {
            statusMessage.textContent = "Slot already booked! Try another time.";
            return;
        }

        const appointmentRef = collection(db, "Appointments");
        
        // Check for existing appointments
        const q = query(appointmentRef,
            where("doctorName", "==", doctorName),
            where("appointmentDate", "==", appointmentDate),
            where("appointmentTime", "==", appointmentTime)
        );
        const existingAppointments = await getDocs(q);

        let canBook = true;
        let lowerPriorityDocRef = null;
        let lowerPriorityData = null;
        let emergencyExists = false;

        existingAppointments.forEach(doc => {
            const data = doc.data();

            if (data.priority === priority) {
                canBook = false;
            }

            if (data.priority === 1) {
                emergencyExists = true;
            }

            if (data.priority === 0 && priority === 1) {
                lowerPriorityDocRef = doc.ref;
                lowerPriorityData = data;
            }
        });

        if (!canBook) {
            statusMessage.textContent = "This slot is already booked with the same priority! Try another time.";
            return;
        }

        if (emergencyExists && priority === 0) {
            statusMessage.textContent = "Emergency appointment already exists! Cannot book normal appointment.";
            return;
        }

        // If emergency appointment is being booked, and a normal appointment exists, reschedule the normal one
        if (priority === 1 && lowerPriorityDocRef) {
            try {
                // Find the next available slot for the same doctor and date
                const nextAvailableTime = await findNextAvailableSlot(doctorName, appointmentDate, appointmentTime);

                if (nextAvailableTime) {
                    // Update the lower priority appointment with the new time
                    await updateDoc(lowerPriorityDocRef, { appointmentTime: nextAvailableTime });

                    // Send notification to the user about rescheduling
                    const message = `Your appointment with Dr. ${doctorName} on ${appointmentDate} at ${lowerPriorityData.appointmentTime} has been rescheduled to ${nextAvailableTime} due to an emergency case.`;
                    await sendAppointmentAlert(lowerPriorityData.email, message);
                    console.log(`Lower priority appointment rescheduled to ${nextAvailableTime}`);
                    
                    // Add log entry for the rescheduled appointment
                    const rescheduleLogRef = collection(db, "RescheduledAppointments");
                    await addDoc(rescheduleLogRef, {
                        email: lowerPriorityData.email,
                        doctorName: doctorName,
                        originalDate: appointmentDate,
                        originalTime: lowerPriorityData.appointmentTime,
                        newTime: nextAvailableTime,
                        rescheduledAt: new Date(),
                        reason: "Emergency appointment preemption"
                    });
                } else {
                    // If no available slot, delete the appointment
                    await deleteDoc(lowerPriorityDocRef);
                    await logDeletedAppointment(lowerPriorityData.email, doctorName, appointmentDate, lowerPriorityData.appointmentTime);
                    
                    const message = `Your appointment with ${doctorName} on ${appointmentDate} at ${lowerPriorityData.appointmentTime} has been cancelled due to an emergency case. No alternative slots were available. Please rebook at your convenience.`;
                    await sendAppointmentAlert(lowerPriorityData.email, message);
                    console.log("Lower priority appointment deleted as no alternative slot was available.");
                }
            } catch (error) {
                console.error("Error rescheduling/deleting lower priority appointment:", error);
                statusMessage.textContent = "Error rescheduling appointment.";
                return;
            }
        }

        // Book new appointment
        await addDoc(appointmentRef, {
            doctorName, 
            appointmentDate, 
            appointmentTime, 
            patientName, 
            email, 
            age, 
            priority,
            createdAt: new Date()
        });

        statusMessage.textContent = priority === 1 
            ? "Emergency appointment booked successfully!" 
            : "Appointment booked successfully!";
            
        // Clear form fields after successful booking
        document.getElementById("patientName").value = "";
        document.getElementById("email").value = "";
        document.getElementById("age").value = "";
        document.getElementById("priority").value = "0";
        
    } catch (error) {
        console.error("Error booking appointment:", error);
        statusMessage.textContent = "An error occurred while booking your appointment. Please try again.";
    }
}

// Load doctors and set event listeners
document.addEventListener("DOMContentLoaded", () => {
    loadDoctors();
    document.getElementById("doctorName").addEventListener("change", loadTimeSlots);
    document.getElementById("appointmentDate").addEventListener("change", loadTimeSlots);
    document.getElementById("bookAppointment").addEventListener("click", bookAppointment);
});