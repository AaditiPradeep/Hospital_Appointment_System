import { db } from "./firebaseConfig.js";  // ✅ Correct import
import { collection, query, where, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Lock Slot Function with emergency override logic
async function lockSlot(doctorName, date, time, priority = 0) {
    const lockRef = collection(db, "LockedSlots");

    // Check if the slot is already locked
    const existingLock = await getDocs(query(lockRef, 
        where("doctorName", "==", doctorName), 
        where("appointmentDate", "==", date), 
        where("appointmentTime", "==", time)
    ));

    // If there's an existing lock, we only allow emergency appointments to override
    if (!existingLock.empty) {
        const lockData = existingLock.docs[0].data();
        // If the existing lock is for an emergency, we allow the booking
        if (lockData.isLocked && priority === 1) {
            console.log("Emergency appointment can override the existing lock.");
            return true; // Emergency appointments are allowed to override the lock
        }
        return false; // Slot is locked and cannot be booked unless emergency
    }

    // Lock the slot for normal or emergency appointments
    await addDoc(lockRef, { 
        doctorName, 
        appointmentDate: date, 
        appointmentTime: time, 
        isLocked: true, 
        timestamp: new Date()  // ✅ Added timestamp for tracking
    });

    // Auto-remove lock after 5 minutes
    setTimeout(async () => {
        const lockDocs = await getDocs(query(lockRef, 
            where("doctorName", "==", doctorName), 
            where("appointmentDate", "==", date), 
            where("appointmentTime", "==", time)
        ));

        if (!lockDocs.empty) {
            await deleteDoc(lockDocs.docs[0].ref);
        }
    }, 300000); // 5 minutes

    return true; // Successfully locked the slot
}

export { lockSlot };  // ✅ Exporting function for use in other files