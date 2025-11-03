// load required modules
const http = require('http');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');

// single filer, 2024 tax facts from IRS.gov  
const taxFacts = {
  taxYear: 2024,
  filingStatus: 'single',
  standardDeduction: 14600,
  brackets: [
    { rate: 0.10, max: 11600 },
    { rate: 0.12, max: 47150 },
    { rate: 0.22, max: 100525 },
    { rate: 0.24, max: 191950 },
    { rate: 0.32, max: 243725 },
    { rate: 0.35, max: 609350 },
    { rate: 0.37, max: null }
  ]
};

// progressive tax math 
function calculateTaxDetails(userIncome, standardDeduction, taxBrackets) {
  const incomeAmount = Number(userIncome);
  const taxableIncome = Math.max(0, incomeAmount - standardDeduction);

  let remainingIncome = taxableIncome;
  let currentLowerBound = 0;
  let totalTaxOwed = 0;
  let marginalRateUsed = 0;
  const bracketDetails = [];

  for (const currentBracket of taxBrackets) {
    const currentUpperBound = currentBracket.max === null ? Infinity : currentBracket.max; // handle top bracket 
    const taxableSlice = Math.max(
      0,
      Math.min(remainingIncome, currentUpperBound - currentLowerBound) // calculate income in this bracket slice
    );

    if (taxableSlice > 0) {
      const taxForSlice = taxableSlice * currentBracket.rate; // tax owed for this bracket slice

      bracketDetails.push({                                   // record details for breakdown
        bracketRate: currentBracket.rate,
        startingRange: currentLowerBound,
        endingRange: currentBracket.max === null ? null : currentUpperBound,
        incomeInThisBracket: taxableSlice,
        taxForThisBracket: taxForSlice
      });

      totalTaxOwed += taxForSlice; // accumulate total tax owed
      remainingIncome -= taxableSlice; // reduce remaining income by the slice  
      marginalRateUsed = currentBracket.rate;  // update marginal rate used
    }

    currentLowerBound = currentUpperBound; // update lower bound for next bracket
    if (remainingIncome <= 0) break;      // exit if all income has been taxed
  }

  const effectiveTaxRate = incomeAmount > 0 ? totalTaxOwed / incomeAmount : 0; // overall effective tax rate

  return {     // return detailed results
    taxableIncome,
    bracketDetails,
    totalTaxOwed,
    effectiveTaxRate,
    marginalTaxRate: marginalRateUsed
  };
}

// tiny static file server with API endpoint  
function serveFile(filePath, res, contentType) {
  fs.readFile(filePath, (readError, fileBuffer) => {
    if (readError) {
      const isHtml = filePath.endsWith('.html');
      res.writeHead(isHtml ? 500 : 404, { 'Content-Type': 'text/plain' });
      res.end(isHtml ? 'Error loading file' : 'File not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fileBuffer);
  });
}

const server = http.createServer((req, res) => {
  const page = url.parse(req.url).pathname;
  const params = querystring.parse(url.parse(req.url).query);

  if (page === '/') return serveFile('index.html', res, 'text/html');

  if (page === '/api') {
    if (!('income' in params)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing income parameter' }));
    }
    const incomeValue = Number(params.income || 0);
    if (Number.isNaN(incomeValue) || incomeValue < 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Income must be a non-negative number' }));
    }
    const result = calculateTaxDetails(incomeValue, taxFacts.standardDeduction, taxFacts.brackets);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(
      JSON.stringify({
        taxYear: taxFacts.taxYear,
        filingStatus: taxFacts.filingStatus,
        standardDeduction: taxFacts.standardDeduction,
        income: incomeValue,
        ...result     // return detailed results 
      })
    );
  }

  if (page === '/css/style.css') return serveFile('css/style.css', res, 'text/css');
  if (page === '/js/main.js') return serveFile('js/main.js', res, 'text/javascript');

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));