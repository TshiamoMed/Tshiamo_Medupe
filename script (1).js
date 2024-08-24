document.getElementById('transactionForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const type = document.getElementById('type').checked ? 'income' : 'expense';
    const name = event.target.name.value;
    const amount = parseFloat(event.target.amount.value);
    const date = event.target.date.value;

    addTransaction(type, name, amount, date);
});

function addTransaction(type, name, amount, date) {
    const transactionList = document.getElementById('transactionList');
    const listItem = document.createElement('li');
    listItem.textContent = `${type === 'income' ? '+' : '-'} $${amount.toFixed(2)} - ${name} on ${date}`;
    transactionList.appendChild(listItem);

    updateBalance(type, amount);
}

function updateBalance(type, amount) {
    const balance = document.getElementById('balance');
    const income = document.getElementById('income');
    const expense = document.getElementById('expense');

    let currentBalance = parseFloat(balance.textContent.replace('$', ''));
    let currentIncome = parseFloat(income.textContent.replace('$', ''));
    let currentExpense = parseFloat(expense.textContent.replace('$', ''));

    if (type === 'income') {
        currentIncome += amount;
    } else {
        currentExpense += amount;
    }

    currentBalance = currentIncome - currentExpense;

    balance.textContent = `$${currentBalance.toFixed(2)}`;
    income.textContent = `$${currentIncome.toFixed(2)}`;
    expense.textContent = `$${currentExpense.toFixed(2)}`;
}
