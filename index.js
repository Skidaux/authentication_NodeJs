

// Initializing the libraries and dependencies needed for the project
const express = require('express'); // Library for creating the backend server
const fs = require('fs'); // Library for reading and writing files
const bodyParser = require('body-parser'); // Library for handling data from forms
const bcrypt = require('bcrypt'); // Library for encrypting passwords
const session = require('express-session'); // Library for managing user sessionss

const app = express(); // Creating the Express app

// Loads the users.json file and puts it in the users variable
let users; // Variable to store users data
try {
  users = fs.readFileSync('users.json'); // Read users.json file
  users = JSON.parse(users); // Parse the file contents as JSON
} catch (error) {
  console.log('Error reading or parsing users.json. Starting with an empty users list.');
  users = []; // If there's an error, start with an empty users list
}


app.use(bodyParser.json()); // Parse JSON data sent in the request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data sent in the request body

// Session management
app.use(
  session({
    secret: 'super_secret', // Secret used to sign the session ID cookie
    resave: false, // Do not save the session if it hasn't been modified
    saveUninitialized: true, // Save uninitialized sessions to the session store
  })
);

app.set('view engine', 'ejs'); // Set EJS as the view engine for rendering Web pages

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next(); // User is logged in, proceed to the next middleware or route handler
  } else {
    res.redirect('/login'); // User is not logged in, redirect to the login page
  }
};

// Middleware to check if user is already logged in
const isAlreadyAuthenticated = (req, res, next) => {
  if (req.session.user) {
    res.redirect('/dashboard'); // User is already logged in, redirect to the dashboard
  } else {
    next(); // User is not logged in, proceed to the next middleware or route handler
  }
};

// Routes for the app

// Home page route
app.get('/', (req, res) => {
  res.render('home', { username: req.session.user ? req.session.user.username : null });
  // Render the 'home' view and pass the username of the logged in user (if available) to the webpage
});

// Login page route
app.get('/login', isAlreadyAuthenticated, (req, res) => {
  res.render('login', { username: req.session.user ? req.session.user.username : null });
  // Render the 'login' view and pass the username of the logged-in user (if available) to the template
});

// Register page route
app.get('/register', isAlreadyAuthenticated, (req, res) => {
  res.render('register', { username: req.session.user ? req.session.user.username : null });
  // Render the 'register' view and pass the username of the logged-in user (if available) to the template
});

// Dashboard page route
app.get('/dashboard', isLoggedIn, (req, res) => {
  res.render('dashboard', { username: req.session.user.username });
  // Render the 'dashboard' view and pass the username of the logged-in user to the template
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(); // Destroy the session, removing the user's session data
  res.redirect('/'); // Redirect to the home page
});

// Login form submission route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(user => user.username === username);

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = user; // Store the user data in the session
    res.redirect('/dashboard'); // Redirect to the dashboard
  } else {
    res.send('Invalid username or password!'); // Username or password is incorrect, send an error message
  }
});

// Register form submission route
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10); // Uisng the bcrypt library to encrypt the password

  if (users.find(user => user.username === username)) {
    res.send('User already exists!'); // Username already exists, send an error message
  } else {
    //Save the user credentials in the users.json file
    const newUser = {
      username,
      password: hashedPassword,
    };

    users.push(newUser); // Add the new user to the users list
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2)); // Write the updated users list to the users.json file

    res.redirect('/login'); // Redirect to the login page
  }
});

// 404 page route
app.get('*', (req, res) => {
  res.render('404', { username: req.session.user ? req.session.user.username : null });
  // Render the '404' view and pass the username of the logged-in user (if available) to the template
});

// Start the server on port 8080 to make it accessible in a web browser
const PORT = 8080;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
