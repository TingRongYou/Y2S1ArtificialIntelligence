let fullData = [];

// ---------------------------
// Fetch data from Flask
// ---------------------------
function fetchData() {
    fetch('/data')
        .then(r => r.json())
        .then(data => {
            fullData = data;
            fetchSummary();

            // Render charts depending on the current page
            if (document.getElementById("pca-plot")) {
                renderPCA(fullData);
            }
            if (document.getElementById("scatter-chart")) {
                // Remove any previous SVG before drawing
                d3.select("#scatter-chart").selectAll("svg").remove();
                drawCaloriesProtein(fullData);
            }
        });
}

// ---------------------------
// Fetch cluster summary
// ---------------------------
function fetchSummary() {
    fetch('/summary')
        .then(r => r.json())
        .then(s => {
            if (document.getElementById("summary")) {
                document.getElementById("summary").innerHTML =
                    `<b>Clusters:</b> ${s.num_clusters} | <b>Noise Points:</b> ${s.num_noise} (${s.noise_pct}%) <br> <b>Cluster Sizes:</b> ${JSON.stringify(s.cluster_sizes)}`;
            }
        });
}

// ---------------------------
// Recluster DBSCAN
// ---------------------------
document.getElementById("recluster-btn")?.addEventListener("click", () => {
    const eps = document.getElementById("eps").value;
    const min_samples = document.getElementById("min_samples").value;

    fetch('/recluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eps, min_samples })
    }).then(() => fetchData());
});

// ---------------------------
// Download CSV
// ---------------------------
document.getElementById("download-btn")?.addEventListener("click", () => {
    window.location.href = "/download";
});

// ---------------------------
// Dark mode toggle
// ---------------------------
document.getElementById("toggle-theme")?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.getElementById("pca-plot")) renderPCA(fullData);
    if (document.getElementById("scatter-chart")) {
        d3.select("#scatter-chart").selectAll("svg").remove();
        drawCaloriesProtein(fullData);
    }
});

// ---------------------------
// Plotly PCA Clustering
// ---------------------------
function renderPCA(data) {
    const clustered = data.filter(d => d.Cluster !== -1);
    const noise = data.filter(d => d.Cluster === -1);
    const isDark = document.body.classList.contains('dark-mode');

    const traceCluster = {
        x: clustered.map(d => d.PCA1),
        y: clustered.map(d => d.PCA2),
        text: clustered.map(d => `${d.Food} (${d.Category}) - Cluster ${d.Cluster}`),
        mode: 'markers',
        marker: {
            size: 10,
            color: clustered.map(d => d.Cluster),
            colorscale: 'Portland',
            line: { width: 1, color: isDark ? '#fff' : '#000' }
        },
        type: 'scatter',
        name: 'Clusters'
    };

    const traceNoise = {
        x: noise.map(d => d.PCA1),
        y: noise.map(d => d.PCA2),
        text: noise.map(d => `${d.Food} (${d.Category}) - Noise`),
        mode: 'markers',
        marker: { size: 8, color: 'gray', line: { width: 1, color: isDark ? '#fff' : '#000' } },
        type: 'scatter',
        name: 'Noise'
    };

    const layout = {
        title: '🍴 PCA Clusters with DBSCAN',
        xaxis: { title: 'PCA1' },
        yaxis: { title: 'PCA2' },
        paper_bgcolor: isDark ? '#181a1b' : '#fff',
        plot_bgcolor: isDark ? '#222' : '#fff',
        font: { color: isDark ? '#f5f5f5' : '#333' }
    };

    Plotly.newPlot('pca-plot', [traceCluster, traceNoise], layout, { responsive: true });
}

// ---------------------------
// D3 Calories vs Protein Scatterplot
// ---------------------------
function drawCaloriesProtein(data) {
    const container = d3.select("#scatter-chart");
    container.selectAll("*").remove();

    const width = container.node().clientWidth;
    const height = 600;
    const margin = { top: 80, right: 50, bottom: 100, left: 130 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xVar = "Calories";
    const yVar = "Protein";

    const xScale = d3.scaleLinear().domain(d3.extent(data, d => +d[xVar])).nice().range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain(d3.extent(data, d => +d[yVar])).nice().range([innerHeight, 0]);

    const uniqueClusters = Array.from(new Set(data.map(d => d.Cluster))).sort((a, b) => a - b);
    const palette = d3.schemeSet2.concat(d3.schemeCategory10);
    const color = d3.scaleOrdinal().domain(uniqueClusters).range(palette.concat(["#808080"]).slice(0, uniqueClusters.length));

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("border-radius", "12px")
        .style("box-shadow", "0 2px 10px rgba(0,0,0,0.1)")
        .style("background", "white");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .attr("font-size", "24px")
        .attr("font-weight", "bold")
        .text("🍛 Calories vs Protein Scatterplot");

    g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(xScale).ticks(10));
    g.append("g").call(d3.axisLeft(yScale).ticks(10));

    g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 50)
        .attr("text-anchor", "middle")
        .attr("font-size", 16)
        .attr("font-weight", 600)
        .text(xVar);

    g.append("text")
        .attr("transform", `translate(-50,${innerHeight / 2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .attr("font-size", 16)
        .attr("font-weight", 600)
        .text(yVar);

    let tooltip = d3.select("body").selectAll(".chart-tooltip").data([0]).join(
        enter => enter.append("div").attr("class", "chart-tooltip").style("opacity", 0)
    );

    g.selectAll("circle").data(data).enter().append("circle")
        .attr("cx", d => xScale(+d[xVar]))
        .attr("cy", d => yScale(+d[yVar]))
        .attr("r", 8)
        .attr("fill", d => d.Cluster === -1 ? 'gray' : color(d.Cluster))
        .attr("stroke", "#333")
        .attr("stroke-width", 1)
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`<b>${d.Food}</b><br>${xVar}: ${d[xVar]}<br>${yVar}: ${d[yVar]}<br>Cluster: ${d.Cluster}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));
}

// ---------------------------
// Initialize only if relevant container exists
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("scatter-chart") || document.getElementById("pca-plot")) {
        fetchData();
    }
});