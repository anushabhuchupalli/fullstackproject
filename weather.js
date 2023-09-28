const express = require('express');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, collection, where, getDocs, addDoc, doc, updateDoc, arrayUnion } = require('firebase-admin/firestore');
const bcrypt = require('bcrypt');

const serviceAccount = require('./capstone.json');
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/loginup', (req, res) => {
  res.sendFile(__dirname + '/public/' + 'loginup.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/wea.html');
});

app.get('/signin', (req, res) => {
  res.sendFile(__dirname + '/public/signin.html');
});

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Query Firestore to check if a user with the same email already exists
    const userRef = db.collection('users');
    const querySnapshot = await userRef.where('email', '==', email).get();

    if (!querySnapshot.empty) {
      res.status(409).send('User with this email already exists');
    } else {
      // Store user data in Firestore
      const hashedPassword = await bcrypt.hash(password, 10);

      await userRef.add({
        email: email,
        password: hashedPassword,
      });

      // Redirect to the login page after successful signup
      res.redirect('/loginup');
    }
  } catch (error) {
    res.status(500).send('Error signing up: ' + error.message);
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Query Firestore to check user credentials
    const userQuery = collection(db, 'users');
    const querySnapshot = await getDocs(
      where(userQuery, 'email', '==', email),
      where(userQuery, 'password', '==', password)
    );

    if (querySnapshot.empty) {
      res.status(401).send('Invalid credentials');
    } else {
      // Store search history in Firestore
      const userId = querySnapshot.docs[0].id;
      const searchInput = 'ReplaceWithUserSearchInput'; // Replace this with the actual search input

      const searchHistoryRef = doc(db, 'searchHistory', userId);
      await updateDoc(searchHistoryRef, {
        history: arrayUnion(searchInput),
      });

      res.redirect('/wea.html'); // Redirect to the weather app page if credentials match
    }
  } catch (error) {
    res.status(500).send('Error checking credentials: ' + error.message);
  }
});

app.listen(3000, () => {
  console.log('App is listening on port 3000');
});
