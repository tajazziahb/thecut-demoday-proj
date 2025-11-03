// initialize DOM elements
const calculateButton = document.querySelector('button');
const incomeInputField = document.querySelector('#userIncome');
const summaryBox = document.querySelector('#output');
const moneyKeptLine = document.querySelector('#moneyKept');

// chart instance
let taxChartInstance = null;

// currency and percentage formatting cite: from Google
function toMoney(amount) {
  return Number(amount || 0).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });
}

function toPercentText(fraction) {
  return (Number(fraction || 0) * 100).toFixed(1) + '%';
}


function fillTotals(payload) { // payload from server to fill totals section cite: from ChatGPT
  document.querySelector('#sdValue').textContent = toMoney(payload.standardDeduction); // output standard deduction total
  document.querySelector('#taxableValue').textContent = toMoney(payload.taxableIncome); // output taxable income total
  document.querySelector('#totalTaxValue').textContent = toMoney(payload.totalTaxOwed); // output total tax owed

  const effectiveDollars = Number(payload.income) * Number(payload.effectiveTaxRate); // calculate effective dollars
  const marginalDollars = Number(payload.income) * Number(payload.marginalTaxRate); // calculate marginal dollars

  document.querySelector('#effectiveRateValue').textContent = toPercentText(payload.effectiveTaxRate); // output effective rate
  document.querySelector('#effectiveDollarValue').textContent = toMoney(effectiveDollars); // output effective dollars
  document.querySelector('#marginalRateValue').textContent = toPercentText(payload.marginalTaxRate); // output marginal rate
  document.querySelector('#marginalDollarValue').textContent = toMoney(marginalDollars); // output marginal dollars

  const moneyKept = Number(payload.income) - Number(payload.totalTaxOwed); // calculate money kept
  document.querySelector('#moneyKeptValue').textContent = toMoney(moneyKept); // output money kept total
}

function fillBracketTable(bracketDetails, taxableIncomeAmount) { // populate tax bracket breakdown table
  const tableBody = document.querySelector('#bracketBody'); // tbody element for bracket details
  tableBody.textContent = ''; // clear existing rows
  bracketDetails.forEach((detail) => { // create a row for each bracket detail
    const row = document.createElement('tr'); // new table row
    const rateCell = document.createElement('td'); // cells for each data point
    const sliceCell = document.createElement('td'); // income slice cell
    const taxCell = document.createElement('td'); // tax owed cell
    const shareCell = document.createElement('td'); // share percentage cell

    rateCell.textContent = `${(detail.bracketRate * 100).toFixed(0)}%`; // format rate as percentage cite: from Google
    sliceCell.textContent = toMoney(detail.incomeInThisBracket); // format income slice as money
    taxCell.textContent = toMoney(detail.taxForThisBracket); // format tax owed as money

    const sharePercent = taxableIncomeAmount > 0 ? (detail.incomeInThisBracket / taxableIncomeAmount) * 100 : 0; // calculate share percentage cite: from Google
    shareCell.textContent = `${sharePercent.toFixed(1)}%`; // output share percentage

    row.appendChild(rateCell); // append cells to the row
    row.appendChild(sliceCell); // append income slice cell
    row.appendChild(taxCell); // append tax cell
    row.appendChild(shareCell); // append share percentage cell
    tableBody.appendChild(row); // append row to table body
  });
}

function revealBreakdown() {
  const section = document.querySelector('#breakdown'); 
  if (section) section.hidden = false; // reveal breakdown section
}

// show summary
function showSummary(payload) {
  const moneyKept = Number(payload.income) - Number(payload.totalTaxOwed); // calculate money kept
  const effectiveDollars = Number(payload.income) * Number(payload.effectiveTaxRate); // calculate effective dollars
  const marginalDollars = Number(payload.income) * Number(payload.marginalTaxRate); // calculate marginal dollars

  summaryBox.textContent =
    `Year: ${payload.taxYear}\n` + // year of tax calculation
    `Filing Status: ${payload.filingStatus}\n` + // filing status
    `Standard Deduction: ${toMoney(payload.standardDeduction)}\n` + // standard deduction amount
    `Taxable Income: ${toMoney(payload.taxableIncome)}\n` + // taxable income amount
    `Total Tax Owed: ${toMoney(payload.totalTaxOwed)}\n` + // total tax owed amount
    `Effective Rate: ${toPercentText(payload.effectiveTaxRate)} (${toMoney(effectiveDollars)})\n` + // effective rate and dollars
    `Marginal Rate: ${toPercentText(payload.marginalTaxRate)} (${toMoney(marginalDollars)})`; // marginal rate and dollars

  moneyKeptLine.textContent = `Money Kept: ${toMoney(moneyKept)}`; // output money kept line
}

// Chart.js Visualization (functional options only; no styling here)
// References: Chart.js docs + Stack Overflow discussions on stacked bars sizing
function renderTaxChart(bracketDetailList, taxableIncomeAmount) { // render tax breakdown chart
  if (!Array.isArray(bracketDetailList) || bracketDetailList.length === 0 || taxableIncomeAmount <= 0) { // no data case
    if (taxChartInstance) { taxChartInstance.destroy(); taxChartInstance = null; } // clear chart if no data
    return;
  }

  // prepare data for chart cite: from Stack Overflow and Chart.js docs
  const bracketLabels = bracketDetailList.map(detail => `${(detail.bracketRate * 100).toFixed(0)}%`); // labels for each bracket
  const taxPaidData = bracketDetailList.map(detail => detail.taxForThisBracket); // tax paid in each bracket
  const incomeSliceData = bracketDetailList.map(detail => detail.incomeInThisBracket); // income slice in each bracket
  const takeHomeData = incomeSliceData.map((sliceAmount, index) => Math.max(0, sliceAmount - taxPaidData[index])); // take-home income in each bracket

  if (typeof Chart === 'undefined') return; // ensure Chart.js is loaded
  const chartContext = document.getElementById('taxChart').getContext('2d'); 

  // ensure tall stacks fit; add headroom and avoid edge cutoff
  const tallestStackValue = Math.max(...incomeSliceData); // find tallest stack cite: from Google
  const yAxisSuggestedMax = tallestStackValue * 1.6;  // add 60% headroom

  const chartData = { // data structure for Chart.js
    labels: bracketLabels,  // x-axis labels
    datasets: [
      { label: 'Tax Paid', data: taxPaidData, stack: 'slice' }, // tax paid dataset
      { label: 'Take-Home Income', data: takeHomeData, stack: 'slice' } // take-home income dataset
    ]
  };

  const chartOptions = { // configuration options for Chart.js
    responsive: false,  // fixed size for clarity
    devicePixelRatio: 1, // standard pixel ratio
    animation: { duration: 200 }, // brief animation on update
    elements: { bar: { borderSkipped: false, minBarLength: 6 } }, // bar styling
    plugins: {
      legend: { position: 'bottom' }, // legend position
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${toMoney(context.parsed.y)}` } } // tooltip formatting
    },
    scales: { // axis configuration
      x: {
        stacked: true,
        offset: true,                 // centers first/last bar so it doesn't clip the edges
        categoryPercentage: 0.45,     // slimmer group width
        barPercentage: 0.7            // slimmer bars inside group
      },
      y: {
        stacked: true, // stack bars vertically
        beginAtZero: true, // y-axis starts at zero
        suggestedMax: yAxisSuggestedMax, // headroom so bars + grid lines stay inside
        grace: '10%', // extra space above tallest bar
        ticks: { callback: (value) => toMoney(value) } // y-axis tick formatting
      }
    },
    normalized: true // ensure stacking normalizes values properly
  };

  if (!taxChartInstance) { // create new chart if none exists
    taxChartInstance = new Chart(chartContext, { type: 'bar', data: chartData, options: chartOptions }); // bar chart type
  } else {
    taxChartInstance.data = chartData; // update existing chart data
    taxChartInstance.options = chartOptions; // update existing chart options
    taxChartInstance.update('none'); // refresh chart without animation
  }
}

calculateButton.addEventListener('click', handleCalculate); 
incomeInputField.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') handleCalculate();
});

function handleCalculate() {
  const incomeValue = incomeInputField.value.trim();

  if (incomeValue === '') {
    summaryBox.style.display = '';
    summaryBox.textContent = 'Please enter your income amount';
    moneyKeptLine.textContent = 'Money Kept: —';
    const breakdownBlock = document.querySelector('#breakdown');
    if (breakdownBlock) breakdownBlock.hidden = true;
    if (taxChartInstance) { taxChartInstance.destroy(); taxChartInstance = null; } // clear chart if no income
    return;
  }

  summaryBox.textContent = '';

  fetch(`/api?income=${incomeValue}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) throw new Error(data.error);

      showSummary(data); // display summary
      summaryBox.style.display = 'none'; // remove redundancy

      fillTotals(data); // fill totals section
      fillBracketTable(data.bracketDetails, Number(data.taxableIncome || 0));   // fill breakdown table
      revealBreakdown();
      renderTaxChart(data.bracketDetails, Number(data.taxableIncome || 0)); // render tax chart
    })
    .catch(() => {
      summaryBox.style.display = '';
      summaryBox.textContent = 'Something went wrong. Try again.';
      moneyKeptLine.textContent = 'Money Kept: —';
      const breakdownBlock = document.querySelector('#breakdown');
      if (breakdownBlock) breakdownBlock.hidden = true;
      if (taxChartInstance) { taxChartInstance.destroy(); taxChartInstance = null; } // clear chart on error
    });
}