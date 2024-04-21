document.getElementById('signup-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the form from submitting normally

    // Get form data
    const formData = new FormData(this);

    // Convert form data to JSON object
    const userData = Object.fromEntries(formData.entries());
    
    // Add isAdmin field with a default value of false
    userData.isAdmin = false;
    console.log(userData);

    try {
        // Make a POST request to the signup endpoint
        const response = await fetch('http://localhost:3000/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        // Check if the request was successful
        if (response.ok) {
            const data = await response.json();
            console.log('User signed up successfully:', data);
            // Redirect the user to the userPage.html page
            window.location.href = 'userPage.html';
        } else {
            // If the request was not successful, parse the error response
            const errorMessage = await response.text();
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Error signing up user:', error.message);
        // Display the error message to the user
        alert(error.message);
    }
});


async function login() {
    const email = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const userData = {
        email,
        password
    };

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Login successful:', data);
            // Inside the login function after successful login
            localStorage.setItem('userInfo', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            window.location.href = 'userPage.html';
        } else {
            const errorMessage = await response.text();
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Error logging in:', error.message);
        document.getElementById('message').textContent = error.message;
    }
}
function openTab(tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
  }
  document.getElementById(tabName).style.display = "block";
}

window.onload = async function() {
    try {
        // Check if the user is already authenticated by validating the token
        const token = localStorage.getItem('token');
        if (token) {
            const response = await fetch('http://localhost:3000/api/auth/validate-token', {
                method: 'POST',
                headers: {
                    'Authorization': `${token}`
                }
            });
            if (response.ok) {
                // If token is valid, redirect to user page
                window.location.href = 'userPage.html';
            }
        }
    } catch (error) {
        console.error('Error validating token:', error.message);
        // Handle error if token validation fails
    }
};