import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadAnalytics() {
    const appointmentSnap = await getDocs(collection(db, "Appointments"));
    const deletedSnap = await getDocs(collection(db, "RescheduledAppointments"));

    const appointments = [];
    const doctorUtil = {};
    const apptPerDay = {};
    let totalWaiting = 0;
    let waitCount = 0;

    appointmentSnap.forEach(doc => {
        const data = doc.data();
        appointments.push(data);

        // Doctor Utilization
        const docName = data.doctorName;
        if (!doctorUtil[docName]) doctorUtil[docName] = 0;
        doctorUtil[docName]++;

        // Appointments per Day
        const date = data.appointmentDate;
        if (!apptPerDay[date]) apptPerDay[date] = 0;
        apptPerDay[date]++;

        // Waiting Time (Optional: You can simulate startedAt, scheduledAt if available)
        if (data.scheduledAt && data.startedAt) {
            const scheduled = new Date(data.scheduledAt);
            const started = new Date(data.startedAt);
            const diffMins = Math.floor((started - scheduled) / 60000);
            if (diffMins >= 0) {
                totalWaiting += diffMins;
                waitCount++;
            }
        }
    });

    const preemptions = deletedSnap.size;
    //const avgWaiting = waitCount ? (totalWaiting / waitCount).toFixed(2) : "N/A";

    // Update metrics
    document.getElementById("preemptionsCount").textContent = preemptions;
    //document.getElementById("avgWaitingTime").textContent = avgWaiting;

    // Visualization with enhanced styling
    plotDoctorUtilizationChart("doctorUtilChart", Object.keys(doctorUtil), Object.values(doctorUtil));
    plotAppointmentsChart("appointmentsPerDayChart", Object.keys(apptPerDay), Object.values(apptPerDay));
}

function plotDoctorUtilizationChart(canvasId, labels, data) {
    const backgroundColors = [
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 205, 86, 0.7)'
    ];
    
    new Chart(document.getElementById(canvasId), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Appointments",
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} appointments`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Appointments'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Doctors'
                    }
                }
            }
        }
    });
}

function plotAppointmentsChart(canvasId, labels, data) {
    new Chart(document.getElementById(canvasId), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Appointments",
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} appointments on ${context.label}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Appointments'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });
}


loadAnalytics();
