import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js"; 
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { db } from "./firebaseConfig.js"; // Import Firestore instance
import { collection, query, where, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js"; // Ensure correct path

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Restrict access to booking page if not logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("userEmail").textContent = user.email;

        // Generate initials for profile icon
        const initials = user.email.charAt(0).toUpperCase();
        document.getElementById("profileIcon").textContent = initials;

        // Allow access to the booking page
        document.getElementById("bookAppointmentBtn").disabled = false;

        // Check for pending notifications
        checkNotifications(user.email);
    } else {
        document.getElementById("userEmail").textContent = "Not logged in";
        document.getElementById("profileIcon").textContent = "?";

        // Redirect unauthenticated users to the login page
        alert("You must be logged in to access the booking page.");
        window.location.href = "login.html";
    }
});

// Function to check for unread notifications
async function checkNotifications(email) {
    const notificationsRef = collection(db, "Notifications");
    const q = query(notificationsRef, where("email", "==", email), where("read", "==", false));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const notifications = snapshot.docs.map(doc => doc.data());
        displayNotifications(notifications);
        deleteReadNotifications(); // Delete read notifications after checking
    } else {
        console.log("No unread notifications.");
    }
}

// Function to display notifications on the dashboard
function displayNotifications(notifications) {
    const notificationList = document.getElementById("notificationList");
    notifications.forEach(notification => {
        const notificationElement = document.createElement("div");
        notificationElement.classList.add("notification");
        notificationElement.textContent = notification.message;
        notificationList.appendChild(notificationElement);
    });
}

// Function to delete read notifications
async function deleteReadNotifications() {
    const notificationsRef = collection(db, "Notifications");
    const q = query(notificationsRef, where("read", "==", true));
    const snapshot = await getDocs(q);

    snapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
        console.log(`Deleted read notification with ID: ${doc.id}`);
    });
}

// Function to send alert notification for deleted appointment
async function sendAppointmentAlert(email, message) {
    try {
        const notificationRef = collection(db, "Notifications");
        await addDoc(notificationRef, {
            email: email,
            message: message,
            read: false
        });
        console.log("Notification sent to:", email);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
}

// Function to handle emergency appointments and delete lower priority appointments
async function handleEmergencyAppointment(doctorName, appointmentDate, appointmentTime, priority) {
    const appointmentRef = collection(db, "Appointments");

    // Query for existing appointments to check priority
    const q = query(appointmentRef, where("doctorName", "==", doctorName), where("appointmentDate", "==", appointmentDate), where("appointmentTime", "==", appointmentTime));
    const existingAppointments = await getDocs(q);

    let lowerPriorityDoc = null;
    let emailToNotify = null;

    existingAppointments.forEach(doc => {
        const data = doc.data();
        if (data.priority === 0 && priority === 1) {
            lowerPriorityDoc = doc.ref; // Found a lower-priority appointment
            emailToNotify = data.email; // Get the email to notify
        }
    });

    // If there's a lower priority appointment and an emergency appointment is being booked
    if (lowerPriorityDoc) {
        try {
            // Delete the lower priority appointment
            await deleteDoc(lowerPriorityDoc);
            console.log("Normal appointment deleted successfully.");

            // Send notification to the user whose appointment was deleted
            const message = `Your appointment on ${appointmentDate} at ${appointmentTime} has been deleted due to an emergency.`;
            await sendAppointmentAlert(emailToNotify, message);

        } catch (error) {
            console.error("Error deleting appointment:", error);
            alert("Error deleting lower priority appointment.");
        }
    }
}

// Logout function
document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            alert("Logout successful!"); // Show success message
            setTimeout(() => {
                window.location.href = "login.html"; // Redirect after 1 second
            }, 1000);
        })
        .catch((error) => {
            console.error("Logout error:", error);
            alert(error.message);
        });
});