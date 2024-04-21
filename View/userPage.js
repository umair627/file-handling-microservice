// userPage.js

// Declare global variables to store current directory information
let currentDirectoryName = '';
let currentDirectoryId = '';
let currentDirectoryPath = '/'; // Assuming the initial directory is the root.
let directoryHistory = []; // Store the history of directory IDs

function updateCurrentDirectory(directoryName, directoryId) {
  currentDirectoryName = directoryName;
  currentDirectoryId = directoryId;

  // Add the current directory to the directory history
  directoryHistory.push({ id: directoryId, name: directoryName });

  // Construct the current directory path based on the most recent entry in the directory history
  currentDirectoryPath = '/';
  for (let i = 0; i < directoryHistory.length; i++) {
      currentDirectoryPath += directoryHistory[i].name + '/';
  }
}

// Function to retrieve user information and token from localStorage and update the DOM
function updateUserInformation() {
    // Retrieve user information and token from localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const token = localStorage.getItem('token');
  
    // Update the DOM with user information
    document.getElementById('NameDisp').innerText = userInfo.name; // Assuming user's name is stored in userInfo.name
    document.getElementById('userNameDisp').innerText = userInfo.username; // Assuming username is stored in userInfo.username
  
    // Optionally, you can display the token somewhere on the page as well
    // For example, you can create a new <p> element and append it to a specific element on the page
    const tokenElement = document.createElement('p');
    tokenElement.textContent = `Token: ${token}`;
    //document.getElementById('tokenContainer').appendChild(tokenElement); // Assuming there's an element with id "tokenContainer" where you want to display the token
}

async function fetchDirectoryContents(directoryId, directoryName) {
    let response;
    try {
        let url = 'http://localhost:3000/api/list-files';
        // If a directory ID is provided, append it to the URL
        if (directoryId !== null && directoryId !== undefined) {
            url += `?directoryId=${directoryId}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `${getToken()}`
            }
        });        
    
      if (!response.ok) {
        throw new Error('Failed to fetch directory contents');
      }
  
      const data = await response.json();

      // Update current directory information
      updateCurrentDirectory(directoryName || data.directory.name, directoryId || data.directory.id);

      // Display current directory path
      const currentDirectoryElement = document.getElementById('currentDirectory');
      currentDirectoryElement.innerText = `Current Directory: ${currentDirectoryPath}`;
    
      // Display file count
      const fileCountElement = document.getElementById('fileCount');
      fileCountElement.innerText = `Files: ${data.files.length}, Directories: ${data.directories.length}`;
  
      // Clear previous file and directory listings
      const directoryListElement = document.getElementById('directoryList');
      directoryListElement.innerHTML = '';
  
      const fileListElement = document.getElementById('fileList');
      fileListElement.innerHTML = '';
  
      // Dynamically generate HTML for directories
      data.directories.forEach(directory => {
        const directoryItem = document.createElement('div');
        directoryItem.classList.add('col-auto');
        directoryItem.classList.add('file-icon');
        directoryItem.innerHTML = `
          <img src="images/directory.png" alt="File Icon">
          <h5 class="title">${directory.name}</h5>
          <span class="date">${directory.createdAt}</span>
        `;  
        directoryItem.addEventListener('click', () => {
          // Add code to handle click event, e.g., open file or show options
          console.log('Directory clicked:', directory.name);
          fetchDirectoryContents(directory._id, directory.name);
        });                                                     
        directoryListElement.appendChild(directoryItem);
      });
  
      // Dynamically generate HTML for files with truncation
      data.files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.classList.add('col-auto');
  
        // Create a clickable file icon
        const fileIcon = document.createElement('div');
        fileIcon.classList.add('file-icon');
  
        // Truncate the file name after the underscore
        const truncatedName = file.name.split('_')[0]; // Get the part before the underscore
  
        fileIcon.innerHTML = `
          <img src="images/file.png" alt="File Icon">
          <h5 class="title">${truncatedName}</h5>
          <span class="date">${file.createdAt}</span>
        `;
  
        // Add click event listener to the file icon
        fileIcon.addEventListener('click', () => {
          // Add code to handle click event, e.g., open file or show options
          console.log('File clicked:', file.name);
        });
  
        // Append file icon to file item
        fileItem.appendChild(fileIcon);
        fileListElement.appendChild(fileItem);
      });
    } catch (error) {
      console.error('Error fetching directory contents:', error);
    }
  }

  function getFile() {
    // Get the file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    
    // Listen for change event when user selects a file
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            // If a file is selected, prompt user to enter directoryId
            //const directoryId = prompt('Enter directoryId (optional):');
            if (currentDirectoryId !== undefined) {
                // If user entered a directoryId or clicked OK, upload the file
                uploadFile(file, currentDirectoryId);
            }
            else{
              uploadFile(file, null);
            }
        }
    });

    // Click the file input element programmatically
    fileInput.click();
}  

function uploadFile(file, directoryId) {
    // Create a FormData object
    const formData = new FormData();
    formData.append('files', file);
    if (directoryId !== null && directoryId !== undefined)
        formData.append('directoryId', directoryId);
    console.log(' directoryId in upload', directoryId);
    fetch('http://localhost:3000/api/upload-file', {
        method: 'POST',
        body: formData,
        headers: {
            // Add any headers needed, such as authorization token
            'Authorization': `${getToken()}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to upload file');
        }
        return response.json();
    })
    .then(data => {
        // Handle successful upload response
        console.log('File uploaded successfully:', data);
        fetchDirectoryContents(currentDirectoryId, currentDirectoryName);
    })
    .catch(error => {
        // Handle upload error
        console.error('Error uploading file:', error);
        // Print the server response if available
        if (error.response) {
            console.error('Server response:', error.response);
        }
    });
}

// Function to go to the parent directory
function goToParentDirectory() {
  console.log('in go parent directory');
    if (directoryHistory.length > 1) {
        // Remove current directory from history
        directoryHistory.pop();
        // Get the previous directory metadata
        const previousDirectory = directoryHistory.pop();
        console.log('Previous Directory ID',previousDirectory);
        // Fetch contents of previous directory
        fetchDirectoryContents(previousDirectory.id, previousDirectory.name);
    }
}

function goToNextDirectory() {
    // Implement forward navigation logic here if needed
}

function getToken() {
    // Implement a function to retrieve the token from wherever it's stored
    // For example, you might retrieve it from localStorage or a global variable
    return localStorage.getItem('token');
}

// Function to sign out
function signOut() {
  // Remove token from local storage
  localStorage.removeItem('token');
  // Redirect user to login page
  window.location.href = 'loginHTML.html'; // Replace 'login.html' with your actual login page URL
}
// Function to handle navigation to the parent directory
document.getElementById('goBackBtn').addEventListener('click', goToParentDirectory);
// Function to handle navigation to the next directory
document.getElementById('goForwardBtn').addEventListener('click', goToNextDirectory);
document.getElementById('creatFolderID').addEventListener('click', async function(event) {
  event.preventDefault(); // Prevent the default action of following the href

  // Prompt user to enter the name of the new folder
  const folderName = prompt('Enter the name of the new folder:');
  if (folderName !== null) { // If user entered a folder name
      try {
          // Make a POST request to create a new directory
          const response = await fetch('http://localhost:3000/api/create-directory', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `${getToken()}`
              },
              body: JSON.stringify({ name: folderName, parentDirectoryId: currentDirectoryId }) // Pass folder name and parent directory ID
          });

          if (response.ok) {
              const data = await response.json();
              console.log('Folder created successfully:', data);
              // Refresh the directory contents after creating the folder
              fetchDirectoryContents(currentDirectoryId, currentDirectoryName);
          } else {
              const errorMessage = await response.text();
              throw new Error(errorMessage);
          }
      } catch (error) {
          console.error('Error creating folder:', error.message);
          alert('Error creating folder: ' + error.message);
      }
  }
});
// Add event listener to sign out button or link
document.getElementById('logoutButton').addEventListener('click', function(event) {
  event.preventDefault(); // Prevent the default action of the link/button
  signOut(); // Call the signOut function
});

// Call the function to update user information when the page loads
window.onload = function() {
  updateUserInformation();
  fetchDirectoryContents(null, 'Home'); // Initially display the home directory
};