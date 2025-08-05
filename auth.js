import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { firebaseConfig } from "./firebaseConfig.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to handle user registration (Sign Up)
async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User registered:", userCredential.user);
        alert("Registration successful!");
        window.location.href = "dashboard.html"; // Redirect to dashboard after signup
    } catch (error) {
        console.error("Registration error:", error.message);
        alert(error.message);
    }
}

// Function to handle user login
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in:", userCredential.user);
        alert("Login successful!");
        window.location.href = "dashboard.html"; // Redirect to dashboard after login
    } catch (error) {
        console.error("Login error:", error.message);
        alert(error.message);
    }
}

// Function to handle user logout
function logoutUser() {
    signOut(auth).then(() => {
        console.log("User logged out");
        alert("Logged out successfully!");
        window.location.href = "index.html"; // Redirect to home page
    }).catch((error) => {
        console.error("Logout error:", error.message);
        alert(error.message);
    });
}

// Restrict access to dashboard.html & appointment booking
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("dashboard.html") || window.location.pathname.includes("appointment.html")) {
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                alert("You must be logged in to access this page.");
                window.location.href = "login.html"; // Redirect to login if not authenticated
            }
        });
    }
});

// Event listeners for login, signup, and logout
document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            loginUser(email, password);
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener("click", () => {
            const email = document.getElementById("regEmail").value;
            const password = document.getElementById("regPassword").value;
            registerUser(email, password);
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logoutUser);
    }
});