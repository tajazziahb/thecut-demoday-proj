# The Cut

## Overview
The Cut is a full-stack web app that reveals what really happens to your income — showing where your money gets sliced, how much is kept, and how tax brackets actually work.  
It turns complex tax math into a visual story, making financial literacy more approachable and interactive for everyone.

[Link to project](https://thecut-demoday-proj-production.up.railway.app/)

![screenshot](img/thecut.png)

### Problem & Goal
Most people know what they earn, but not what they actually keep — or how each tax bracket shapes that outcome.  
The goal of The Cut is to make financial clarity visual, intuitive, and empowering through design and storytelling.

## How It's Made
Built using:
- **Node.js** for the backend starter API (`http`, `fs`, `url`, `querystring`)
- **JavaScript**, **HTML**, and **CSS** for the frontend
- **Chart.js** for live, vertical bar graphs that visualize each income range  

All files are hand-coded for readability, following clear naming conventions and no unnecessary complexity.  
No frameworks were used — just clean logic, data visualization, and functional design.

## How It Works
1. The user inputs their annual income and clicks **Calculate**.  
2. The backend computes:
   - Standard deduction  
   - Taxable income  
   - Total tax owed  
   - Effective and marginal tax rates  
3. The frontend:
   - Displays a breakdown of how each bracket applies  
   - Shows the user’s **Money Kept** amount  
   - Renders a stacked bar graph illustrating the taxed and take-home portions  

## Optimizations
- Adjusted scaling for smoother Chart.js visuals and responsive layout  
- Simplified backend math for clarity and performance  
- Replaced jargon with human-readable terms for accessibility  
- Descriptive variable names (no single-letter variables) for better clarity  
- Clean separation between logic, structure, and style  

## Lessons Learned
- Progressive tax math requires both accuracy and clarity to explain well  
- Visual context drastically improves understanding of financial data  
- Chart.js becomes intuitive when you focus on structure over styling  
- Clear naming and concise code save hours of debugging later  

---

**Built to show what really happens before your paycheck hits your pocket.**