document.addEventListener("DOMContentLoaded", function () {
    let selectedMode = 1; // Default: Normal mode

    const toggleOptions = document.querySelectorAll(".toggle-option");
    const toggleBackground = document.querySelector(".toggle-background");

    function updateBackground() {
        const selectedButton = document.querySelector(".toggle-option.selected");
        if (!selectedButton) return;

        const buttonWidth = selectedButton.offsetWidth;
        const buttonLeft = selectedButton.offsetLeft;

        const extraPadding = 12; // Increase background size slightly on both sides
        toggleBackground.style.width = `${buttonWidth + extraPadding}px`;
        toggleBackground.style.transform = `translateX(${buttonLeft - extraPadding / 2}px)`;

        // toggleBackground.style.transform = `translateX(${buttonLeft - 5}px)`;
    }

    // Initialize background position when page loads
    window.addEventListener("resize", updateBackground); // Adjust on window resize
    updateBackground();

    toggleOptions.forEach(option => {
        option.addEventListener("click", function () {
            selectedMode = parseInt(this.dataset.mode);

            // Update selected class
            toggleOptions.forEach(btn => btn.classList.remove("selected"));
            this.classList.add("selected");

            // Update background position
            updateBackground();
        });
    });

    document.getElementById("runSimulation").addEventListener("click", function () {
        const d = parseInt(document.getElementById("diceSides").value);
        const num = parseInt(document.getElementById("numDice").value);
        const sims = parseInt(document.getElementById("numSims").value);

        const d_min = parseInt(document.getElementById("diceSides").min);
        const d_max = parseInt(document.getElementById("diceSides").max);

        const num_min = parseInt(document.getElementById("numDice").min);
        const num_max = parseInt(document.getElementById("numDice").max);

        const sim_min = parseInt(document.getElementById("numSims").min);
        const sim_max = parseInt(document.getElementById("numSims").max);

        if (isNaN(d) || isNaN(num) || isNaN(sims)) {
            alert("Please enter a number for each value");
            return;
        }

        if (d < d_min || d > d_max) {
            alert("Please enter a valid sided dice");
            return;
        }

        if (num < num_min || num > num_max) {
            alert("Please enter a valid number of dice");
            return;
        }

        if (sims < sim_min || sims > sim_max) {
            alert("Please enter a valid number of Simulations");
            return;
        }

        const data = rollDice(d, num, selectedMode, sims);
        drawChart(data);
    });

    function rollDice(d, num, mode, loops = 100000) {
        let counts = {};
        for (let i = 0; i < loops; i++) {
            let sum1 = 0, sum2 = 0;
            for (let j = 0; j < num; j++) {
                sum1 += Math.floor(Math.random() * d) + 1;
                sum2 += Math.floor(Math.random() * d) + 1;
            }

            let finalSum;
            if (mode === 0) finalSum = Math.min(sum1, sum2); // Disadvantage
            else if (mode === 2) finalSum = Math.max(sum1, sum2); // Advantage
            else finalSum = sum1; // Normal

            counts[finalSum] = (counts[finalSum] || 0) + 1;
        }

        return Object.keys(counts).map(value => ({
            value: parseInt(value),
            count: counts[value]
        })).sort((a, b) => a.value - b.value);
    }

    function drawChart(data) {
        const width = 800, height = 500;
        const margin = { top: 30, right: 30, bottom: 50, left: 60 };

        d3.select("#chart").selectAll("*").remove(); // Clear previous chart

        const svg = d3.select("#chart")
            .attr("width", width)
            .attr("height", height);

        const x = d3.scaleBand()
            .domain(data.map(d => d.value))
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .nice()
            .range([height - margin.bottom, margin.top]);

        // Calculate total count for percentage calculations
        const totalCount = data.reduce((sum, d) => sum + d.count, 0);

        // Determine dynamic font size based on number of bars
        const baseFontSize = 14;
        const minFontSize = 8;
        const fontSize = Math.max(minFontSize, baseFontSize - Math.sqrt(data.length));

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        // Draw bars with animation
        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.value))
            .attr("y", height - margin.bottom)  // Start at bottom
            .attr("height", 0)  // Start with no height
            .attr("width", x.bandwidth())
            .attr("fill", "steelblue")
            .transition()  // Animate the bars rising
            .duration(1000)  // 1-second duration
            // .ease(d3.easeBounceOut)  // Bouncy effect
            .attr("y", d => y(d.count))
            .attr("height", d => height - margin.bottom - y(d.count));

        // Add percentage labels with animation
        svg.selectAll(".label")
            .data(data)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => x(d.value) + x.bandwidth() / 2)
            .attr("y", height - margin.bottom)  // Start at bottom
            .attr("text-anchor", "middle")
            .attr("font-size", `${fontSize}px`)
            .attr("fill", d => {
                const barHeight = height - margin.bottom - y(d.count);
                return barHeight > 20 ? "white" : "black"; // White inside, black above
            })
            .text(d => `${((d.count / totalCount) * 100).toFixed(1)}%`)
            .transition()  // Animate label movement
            .duration(1000)  // 1-second duration
            // .ease(d3.easeBounceOut)  // Same easing as bars
            .attr("y", d => {
                const barHeight = height - margin.bottom - y(d.count);
                return barHeight > 20 ? y(d.count) + 15 : y(d.count) - 5; // Inside if tall, above if short
            });
    }
});