let balance = 0;
let userName = '';
let transactionHistory = [];

document.getElementById('createAccountForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const input = document.getElementById('username');
  userName = input.value.trim();
  if (userName) {
    document.getElementById('displayName').textContent = userName;
    document.getElementById('accountInfo').classList.remove('hidden');
    input.value = '';
  }
});

function updateBalanceDisplay() {
  document.getElementById('balance').textContent = balance.toFixed(2);
}

function addTransaction(type, amount) {
  const date = new Date().toLocaleString();
  const entry = `${date} - ${type}: $${amount.toFixed(2)}`;
  transactionHistory.push(entry);

  const li = document.createElement('li');
  li.textContent = entry;
  document.getElementById('history').prepend(li);
}

function deposit() {
  const amount = parseFloat(document.getElementById('amount').value);
  if (!isNaN(amount) && amount > 0) {
    balance += amount;
    updateBalanceDisplay();
    addTransaction('Deposit', amount);
  } else {
    alert('Please enter a valid amount');
  }
  document.getElementById('amount').value = '';
}

function withdraw() {
  const amount = parseFloat(document.getElementById('amount').value);
  if (!isNaN(amount) && amount > 0) {
    if (amount <= balance) {
      balance -= amount;
      updateBalanceDisplay();
      addTransaction('Withdrawal', amount);
    } else {
      alert('Insufficient balance');
    }
  } else {
    alert('Please enter a valid amount');
  }
  document.getElementById('amount').value = '';
}
