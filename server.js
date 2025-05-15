const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const usersFile = 'users.txt';
const dataFile = 'data.json';

// Helper to load or initialize data
const getData = () => {
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '{}');
  return JSON.parse(fs.readFileSync(dataFile));
};

const saveData = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

// ===== AUTH ROUTES =====

// Signup
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  const userLine = `${username}:${password}\n`;

  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '');

  const existing = fs.readFileSync(usersFile, 'utf-8');
  if (existing.includes(`${username}:`)) return res.send('Username already exists!');

  fs.appendFileSync(usersFile, userLine);

  const data = getData();
  data[username] = { balance: 0, transactions: [] };
  saveData(data);

  res.send('Signup successful! <a href="/">Login here</a>');
});

//login
// User login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const credentials = `${username}:${password}`;
  const users = fs.readFileSync(usersFile, 'utf-8').split('\n');

  // ❌ If trying to log in as admin from user page, reject it
  if (username.trim().toLowerCase() === 'admin') {
    return res.send(`
      <script>
        alert("Invalid credentials.");
        window.location.href = "/";
      </script>
    `);
  }

  // ✅ Normal user login
  if (users.includes(credentials)) {
    return res.send(`
      <script>
        localStorage.setItem('bankUser', '${username}');
        window.location.href = 'dashboard.html';
      </script>
    `);
  }

  // ❌ Invalid user
  res.send(`
    <script>
      alert("Invalid credentials.");
      window.location.href = "/";
    </script>
  `);
});




app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  const credentials = `${username}:${password}`;
  const users = fs.readFileSync(usersFile, 'utf-8').split('\n');

  if (username.trim().toLowerCase() === 'admin' && users.includes(credentials)) {
    return res.send(`
      <script>
        localStorage.setItem('bankUser', 'admin');
        window.location.href = 'admin.html';
      </script>
    `);
  }

  res.send(`
    <script>
      alert("Invalid admin credentials.");
      window.location.href = "/admin-login.html";
    </script>
  `);
});






// ===== BANKING ROUTES =====

// Get balance
app.get('/balance', (req, res) => {
  const { username } = req.query;
  const data = getData();
  if (!data[username]) return res.status(404).json({ error: 'User not found' });

  res.json({ balance: data[username].balance });
});

// Deposit
app.post('/deposit', (req, res) => {
  const { username, amount } = req.body;
  const data = getData();

  if (!data[username]) return res.status(404).send('User not found');
  if (amount <= 0) return res.status(400).send('Amount must be greater than 0');

  data[username].balance += amount;
  data[username].transactions.push({
    type: 'deposit',
    amount,
    date: new Date().toISOString().split('T')[0]
  });

  saveData(data);
  res.send('Deposit successful!');
});

// Withdraw
app.post('/withdraw', (req, res) => {
  const { username, amount } = req.body;
  const data = getData();

  if (!data[username]) return res.status(404).send('User not found');
  if (amount <= 0) return res.status(400).send('Amount must be greater than 0');
  if (data[username].balance < amount) return res.status(400).send('Insufficient balance');

  data[username].balance -= amount;
  data[username].transactions.push({
    type: 'withdraw',
    amount,
    date: new Date().toISOString().split('T')[0]
  });

  saveData(data);
  res.send('Withdrawal successful!');
});

// Transfer
app.post('/transfer', (req, res) => {
  const { from, to, amount } = req.body;
  const data = getData();

  if (!from || !to || isNaN(amount) || amount <= 0) {
    return res.status(400).send("Invalid input.");
  }

  if (!data[from] || !data[to]) {
    return res.status(404).send("User not found.");
  }

  if (from === to) return res.status(400).send("Cannot transfer to self.");
  if (data[from].balance < amount) return res.status(400).send("Insufficient funds.");

  // Update balances
  data[from].balance -= amount;
  data[to].balance += amount;

  const date = new Date().toISOString().split('T')[0];

  // Log transactions
  data[from].transactions.push({ type: `transfer_to:${to}`, amount, date });
  data[to].transactions.push({ type: `transfer_from:${from}`, amount, date });

  saveData(data);

  res.send("Transfer successful.");
});

// Transaction history
app.get('/transactions', (req, res) => {
  const { username } = req.query;
  const data = getData();

  if (!data[username]) return res.status(404).send('User not found');
  res.json(data[username].transactions);
});

// Admin - list all users and balances
app.get('/admin', (req, res) => {
  const data = getData();
  const users = Object.keys(data).map(username => ({
    username,
    balance: data[username].balance
  }));
  res.json(users);
});

// Server start
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
