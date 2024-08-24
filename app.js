const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const path = require("path");
const session = require('express-session');

dotenv.config();

const app = express();

app.use(session({
    secret: 'your_secret_key',  // Replace 'your_secret_key' with an actual secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

const port = 5001;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});

db.connect((err) => {
    if (err) {
        console.log("Error connecting to the database:", err.message);
    } else {
        console.log("Database connected successfully");
    }
});

const userQuery = `
    CREATE TABLE IF NOT EXISTS USER (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255)
    );
`;

db.query(userQuery, (err) => {
    if (err) {
        console.log("Error creating USER table:", err.message);
    } else {
        console.log("USER table created successfully");
    }
});

const expenseQuery = `
    CREATE TABLE IF NOT EXISTS EXPENSES (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        amount DECIMAL(10, 2),
        date DATE,
        category VARCHAR(255),
        type ENUM('income', 'expense'),
        FOREIGN KEY (user_id) REFERENCES USER(id)
    );
`;

db.query(expenseQuery, (err) => {
    if (err) {
        console.log("Error creating EXPENSES table:", err.message);
    } else {
        console.log("EXPENSES table created successfully");
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);

    db.query('INSERT INTO USER SET ?', { username, password: hashedPassword }, (err) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error registering user');
        } else {
            res.redirect('/login');
        }
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM USER WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error during login');
        } else if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
            res.send('Username or Password is incorrect');
        } else {
            req.session.user_id = results[0].id;
            res.redirect('/');
        }
    });
});

app.post('/add-expense', (req, res) => {
    const { amount, date, category, type } = req.body;
    const user_id = req.session.user_id;

    if (!user_id) {
        return res.status(401).send('Unauthorized');
    }

    const expense = { user_id, amount, date, category, type };
    db.query('INSERT INTO EXPENSES SET ?', expense, (err) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error adding transaction');
        } else {
            res.sendStatus(200);
        }
    });
});

app.get('/expenses', (req, res) => {
    const user_id = req.session.user_id;

    if (!user_id) {
        return res.status(401).send('Unauthorized');
    }

    db.query('SELECT * FROM EXPENSES WHERE user_id = ? ORDER BY date DESC', [user_id], (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error retrieving expenses');
        } else {
            res.json(results);
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
