// Firebase configuration
const firebaseConfig = {
  //nuh uh
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

function signOut() {
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Sign out error:', error);
    });
}
/* coming soon
auth.onAuthStateChanged((user) => {
    if (user) {
        const userRef = database.ref('users/' + user.uid);
        userRef.once('value', (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                const sidebarUsername = document.getElementById("sidebarUsername");
                const sidebarEmail = document.getElementById("sidebarEmail");
                const authStatus = document.getElementById("authStatus");
                const submitLocationButton = document.getElementById("submitLocationButton");
                const signupButton = document.getElementById("signupButton");
                const loginButton = document.getElementById("loginButton");
                const adminButton = document.getElementById("adminButton");

                if (sidebarUsername) sidebarUsername.innerText = `Username: ${userData.username}`;
                if (sidebarEmail) sidebarEmail.innerText = `Email: ${user.email}`;
                if (authStatus) authStatus.innerText = "Authenticated"; // Display authentication status
                if (submitLocationButton) submitLocationButton.style.display = "block"; // Show the button
                if (signupButton) signupButton.style.display = "none"; // Hide the sign up button
                if (loginButton) loginButton.style.display = "none"; // Hide the log in button
                if (userData.role === 'admin') {
                    if (submitLocationButton) submitLocationButton.style.display = "none"; // Hide the submit location button
                    if (adminButton) adminButton.style.display = "block"; // Show the admin button
                }
            } else {
                const sidebarUsername = document.getElementById("sidebarUsername");
                const sidebarEmail = document.getElementById("sidebarEmail");
                const authStatus = document.getElementById("authStatus");
                const submitLocationButton = document.getElementById("submitLocationButton");
                const signupButton = document.getElementById("signupButton");
                const loginButton = document.getElementById("loginButton");
                const adminButton = document.getElementById("adminButton");

                if (sidebarUsername) sidebarUsername.innerText = "Username: N/A";
                if (sidebarEmail) sidebarEmail.innerText = `Email: ${user.email}`;
                if (authStatus) authStatus.innerText = "Authenticated"; // Display authentication status
                if (submitLocationButton) submitLocationButton.style.display = "block"; // Show the button
                if (signupButton) signupButton.style.display = "none"; // Hide the sign up button
                if (loginButton) loginButton.style.display = "none"; // Hide the log in button
                if (userData.role === 'admin') {
                    if (submitLocationButton) submitLocationButton.style.display = "none"; // Hide the submit location button
                    if (adminButton) adminButton.style.display = "block"; // Show the admin button
                }
            }
        });
    } else {
        const authStatus = document.getElementById("authStatus");
        const profile = document.getElementById("profile");
        if (authStatus) authStatus.innerText = "Not Authenticated"; // Display authentication status
        if (profile) profile.style.display = "none"; // Hide the profile icon
    }
});
*/