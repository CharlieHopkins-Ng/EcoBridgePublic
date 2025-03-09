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

auth.onAuthStateChanged((user) => {
    if (user) {
        const userRef = database.ref('users/' + user.uid);
        userRef.once('value', (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                document.getElementById("sidebarUsername").innerText = `Username: ${userData.username}`;
                document.getElementById("sidebarEmail").innerText = `Email: ${user.email}`;
                document.getElementById("authStatus").innerText = "Authenticated"; // Display authentication status
                document.getElementById("submitLocationButton").style.display = "block"; // Show the button
                document.getElementById("signupButton").style.display = "none"; // Hide the sign up button
                document.getElementById("loginButton").style.display = "none"; // Hide the log in button
                if (userData.role === 'admin') {
                    document.getElementById("adminButton").style.display = "block"; // Show the admin button
                }
            } else {
                document.getElementById("sidebarUsername").innerText = "Username: N/A";
                document.getElementById("sidebarEmail").innerText = `Email: ${user.email}`;
                document.getElementById("authStatus").innerText = "Authenticated"; // Display authentication status
                document.getElementById("submitLocationButton").style.display = "block"; // Show the button
                document.getElementById("signupButton").style.display = "none"; // Hide the sign up button
                document.getElementById("loginButton").style.display = "none"; // Hide the log in button
                if (userData.role === 'admin') {
                    document.getElementById("adminButton").style.display = "block"; // Show the admin button
                }
            }
        });
    } else {
        document.getElementById("authStatus").innerText = "Not Authenticated"; // Display authentication status
        document.getElementById("profile").style.display = "none"; // Hide the profile icon
    }
});