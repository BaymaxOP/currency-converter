const baseURL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";

// Wait for DOM and all scripts to load
document.addEventListener('DOMContentLoaded', function() {
    // Check if countryList exists
    if (typeof countryList === 'undefined') {
        console.error('countryList is not defined. Make sure the countries.js file is loaded before this script.');
        return;
    }

    const dropdowns = document.querySelectorAll(".dropdown select");
    const btn = document.querySelector("form button:not(.swap-btn)");
    const fromCurr = document.querySelector(".from select");
    const toCurr = document.querySelector(".to select");
    const msg = document.querySelector(".msg");
    const amountInput = document.querySelector(".amount input");

    // Check if all required elements exist
    if (!dropdowns.length || !btn || !fromCurr || !toCurr || !msg || !amountInput) {
        console.error('Required DOM elements not found. Check your HTML structure.');
        return;
    }

    // Set input type to number and add validation
    amountInput.type = "number";
    amountInput.min = "0";
    amountInput.step = "0.01";
    amountInput.placeholder = "Enter amount";

    // Simplified input validation - only format on blur to avoid interfering with typing
    amountInput.addEventListener("blur", (evt) => {
        let value = parseFloat(evt.target.value);
        
        // If invalid number, set to 1
        if (isNaN(value) || value <= 0) {
            evt.target.value = "1";
            return;
        }
        
        // Round to 2 decimal places
        evt.target.value = value.toFixed(2);
    });

    // Allow typing decimal numbers without interference
    amountInput.addEventListener("input", (evt) => {
        let value = evt.target.value;
        
        // Only remove invalid characters but don't format while typing
        // This regex allows numbers, decimal point, and negative sign at start
        if (!/^-?\d*\.?\d*$/.test(value)) {
            // If invalid, remove the last character
            evt.target.value = value.slice(0, -1);
        }
    });

    // Prevent invalid paste content
    amountInput.addEventListener("paste", (evt) => {
        setTimeout(() => {
            let value = evt.target.value;
            
            // Clean the pasted content
            value = value.replace(/[^0-9.-]/g, '');
            
            // Ensure only one decimal point
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            
            // Ensure only one negative sign at the beginning
            if (value.indexOf('-') > 0) {
                value = value.replace(/-/g, '');
            }
            
            evt.target.value = value;
        }, 0);
    });

    // Initialize dropdowns with currency options
    for (let select of dropdowns) {
        for (let currCode in countryList) {
            let newOption = document.createElement("option");
            newOption.innerText = currCode;
            newOption.value = currCode;
            if (select.name === "from" && currCode === "USD") {
                newOption.selected = "selected";
            }
            else if (select.name === "to" && currCode === "INR") {
                newOption.selected = "selected";
            }
            select.append(newOption);
        }
        
        select.addEventListener("change", (evt) => {
            updateFlag(evt.target);
            // Only update flag, don't auto-update exchange rate
        });
    }

    const updateExchangeRate = async () => {
        try {
            // Show loading state
            msg.innerText = "Getting exchange rate...";
            btn.innerText = "Loading...";
            btn.disabled = true;
            
            let amtVal = parseFloat(amountInput.value);
            if (isNaN(amtVal) || amtVal <= 0) {
                amtVal = 1;
                amountInput.value = "1";
            }

            const URL = `${baseURL}/${fromCurr.value.toLowerCase()}.json`;
            console.log('Fetching from:', URL);
            
            let response = await fetch(URL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            let data = await response.json();
            console.log('API Response:', data);
            
            let rate = data[fromCurr.value.toLowerCase()][toCurr.value.toLowerCase()];
            
            if (!rate) {
                throw new Error("Exchange rate not found");
            }
            
            console.log("Exchange rate:", rate);

            let finalAmount = (amtVal * rate).toFixed(2);
            msg.innerText = `${amtVal} ${fromCurr.value} = ${finalAmount} ${toCurr.value}`;
            
            // Reset button state
            btn.innerText = "Get Exchange Rate";
            btn.disabled = false;
            
        } catch (error) {
            console.error("Error fetching exchange rate:", error);
            msg.innerText = "Error getting exchange rate. Please try again.";
            btn.innerText = "Get Exchange Rate";
            btn.disabled = false;
        }
    }

    const updateFlag = (element) => {
        let currCode = element.value;
        let countryCode = countryList[currCode];
        let newSrc = `https://flagsapi.com/${countryCode}/flat/64.png`;
        let img = element.parentElement.querySelector("img");
        if (img) {
            img.src = newSrc;
            img.alt = `${currCode} flag`;
        }
    }

    // Swap button functionality
    const swapBtn = document.querySelector(".swap-btn");

    if (swapBtn) {
        swapBtn.addEventListener("click", (evt) => {
            evt.preventDefault();
            
            // Add rotation animation
            swapBtn.style.transform = "rotate(180deg)";
            setTimeout(() => {
                swapBtn.style.transform = "rotate(0deg)";
            }, 300);
            
            // Swap selected values
            let temp = fromCurr.value;
            fromCurr.value = toCurr.value;
            toCurr.value = temp;

            // Trigger flag updates
            updateFlag(fromCurr);
            updateFlag(toCurr);

            // Don't auto-refresh conversion, wait for user to click button
        });
    }

    // Main button event listener
    btn.addEventListener("click", (evt) => {
        evt.preventDefault();
        updateExchangeRate();
    });

    // Prevent form submission
    const form = document.querySelector("form");
    if (form) {
        form.addEventListener("submit", (evt) => {
            evt.preventDefault();
            updateExchangeRate();
        });
    }

    // Initialize on page load
    msg.innerText = "1 USD = 80 INR";
    // Initialize flags
    updateFlag(fromCurr);
    updateFlag(toCurr);

    // Handle online/offline status
    window.addEventListener("online", () => {
        // Don't auto-update when coming back online
        // Let user click the button when ready
    });

    window.addEventListener("offline", () => {
        msg.innerText = "No internet connection. Please check your connection.";
    });
});