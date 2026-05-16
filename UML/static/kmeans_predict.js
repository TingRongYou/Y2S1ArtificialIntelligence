document.addEventListener("DOMContentLoaded", () => {

    const predictBtn = document.getElementById("predict-btn");
    const historyDropdown = document.getElementById("history-dropdown");
    if (!predictBtn) return;

    window.currentInputs = null;
    window.currentClusterData = null;

    predictBtn.addEventListener("click", () => {

        const nutrients = ["Calories","Protein","Fat","Fiber","Carbs"];
        const inputs = nutrients.reduce((obj, id) => {
            obj[id] = parseFloat(document.getElementById(id).value);
            return obj;
        }, {});

        const messageDiv = document.getElementById("message");
        const resultDiv = document.getElementById("result");
        const inputDisplay = document.getElementById("input-display");

        messageDiv.innerText = "";
        resultDiv.innerText = "";
        inputDisplay.innerHTML = "";

        const validRanges = {Calories:[0,1000], Protein:[0,100], Fat:[0,100], Fiber:[0,30], Carbs:[0,200]};
        for(let key in inputs){
            const [min,max] = validRanges[key];
            if(isNaN(inputs[key]) || inputs[key]<min || inputs[key]>max){
                messageDiv.innerText=`Error: ${key} must be between ${min} and ${max}.`;
                return;
            }
        }

        const route = window.datasetType === "clean"
            ? "/predict_kmeans_clean"
            : "/predict_kmeans_original";

        fetch(route, {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(inputs)
        })
        .then(r => r.json())
        .then(data => {
            if(data.error){ messageDiv.innerText = "Error: "+data.error; return; }

            resultDiv.innerText = "Predicted Cluster: "+data.cluster_name;

            let tableHTML = `<table class="nutrient-table"><thead><tr><th>Nutrient</th><th>Value</th></tr></thead>
                <tbody>${nutrients.map(n=>`<tr><td>${n}</td><td>${inputs[n]}</td></tr>`).join('')}</tbody></table>`;
            inputDisplay.innerHTML = `<b>Entered Nutrients:</b>`+tableHTML;

            let optionText = `Cluster: ${data.cluster_name} | ` + nutrients.map(n=>`${n}:${inputs[n]}`).join(", ");
            let newOption = document.createElement("option");
            newOption.text = optionText;
            newOption.value = JSON.stringify(inputs);
            historyDropdown.add(newOption);

            nutrients.forEach(n => document.getElementById(n).value=0);

            fetch(`/cluster_data/${data.cluster_id}?dataset=${route.includes("clean")?"clean":"original"}`)
            .then(r=>r.json())
            .then(clusterData=>{
                window.currentInputs = inputs;
                window.currentClusterData = clusterData;
                updateDashboard(inputs, clusterData);
            });
        })
        .catch(err=>{
            messageDiv.innerText="Error: Could not get response from server.";
            console.error(err);
        });
    });

    historyDropdown.addEventListener("change", ()=>{
        if(!historyDropdown.value) return;
        const pastInputs = JSON.parse(historyDropdown.value);
        Object.keys(pastInputs).forEach(id=>document.getElementById(id).value=pastInputs[id]);
    });

    document.addEventListener("replot-charts", () => {
        if(window.currentInputs && window.currentClusterData){
            updateDashboard(window.currentInputs, window.currentClusterData);
        }
    });
});

// ================= Plotly Theme Based on Dark Mode =================
function getPlotlyTheme(){
    const isDark = document.body.classList.contains("dark-mode");
    return {
        plot_bgcolor: isDark ? '#1e1e1e' : '#ffffff',
        paper_bgcolor: isDark ? '#1e1e1e' : '#ffffff',
        font: {color: isDark ? '#ffffff' : '#000000'}
    };
}

// ================= Update Dashboard =================
function updateDashboard(inputs, clusterData){
    const dashboardDiv = document.getElementById("dashboard");
    const summaryDiv = document.getElementById("cluster-summary");
    const radarDiv = document.getElementById("radar-chart");
    const barDiv = document.getElementById("bar-chart");
    const pieDiv = document.getElementById("pie-chart");
    const boxDiv = document.getElementById("box-chart");

    dashboardDiv.style.display="block";

    // ---------- Container Background ----------
    const isDark = document.body.classList.contains("dark-mode");
    dashboardDiv.style.padding = "15px";
    dashboardDiv.style.borderRadius = "8px";

    // Cluster summary
    summaryDiv.innerHTML = `<b>Cluster:</b> ${clusterData.name} &nbsp;|&nbsp;`+
        Object.keys(clusterData.avg).map(k=>`<b>Avg ${k}:</b> ${clusterData.avg[k].toFixed(1)}`).join(" &nbsp;|&nbsp; ");
    summaryDiv.style.padding = "10px";
    summaryDiv.style.borderRadius = "5px";
    summaryDiv.style.marginBottom = "15px";

    const nutrients = Object.keys(clusterData.avg);
    const theme = getPlotlyTheme();

    // ---------- Radar Chart ----------
    Plotly.newPlot(radarDiv, [
        {type:'scatterpolar', r:nutrients.map(n=>inputs[n]), theta:nutrients, fill:'toself', name:'Your Input'},
        {type:'scatterpolar', r:nutrients.map(n=>clusterData.avg[n]), theta:nutrients, fill:'toself', name:'Cluster Avg'}
    ], {...theme, title: 'Radar Chart: Your Input vs Cluster Avg', polar:{radialaxis:{visible:true}}});
    radarDiv.style.backgroundColor=isDark?'#1e1e1e':'#ffffff';
    radarDiv.style.border="1px solid #ccc";
    radarDiv.style.borderRadius="5px";
    radarDiv.style.marginBottom="15px";

    // ---------- Bar Chart ----------
    Plotly.newPlot(barDiv, [
        {x:nutrients, y:nutrients.map(n=>inputs[n]), name:'Your Input', type:'bar'},
        {x:nutrients, y:nutrients.map(n=>clusterData.avg[n]), name:'Cluster Avg', type:'bar'}
    ], {...theme, barmode:'group', title:'Bar Chart: Your Input vs Cluster Avg'});
    barDiv.style.backgroundColor=isDark?'#1e1e1e':'#ffffff';
    barDiv.style.border="1px solid #ccc";
    barDiv.style.borderRadius="5px";
    barDiv.style.marginBottom="15px";

    // ---------- Pie Chart ----------
    const macros = ['Protein','Fat','Carbs'];
    Plotly.newPlot(pieDiv, [
        {
            values: macros.map(m => inputs[m]),
            labels: macros,
            type: 'pie',
            name: 'Your Input',
            domain: { x: [0.2, 0.8], y: [0, 1] } // shrink width horizontally
        },
        {
            values: macros.map(m => clusterData.avg[m]),
            labels: macros,
            type: 'pie',
            name: 'Cluster Avg',
            domain: { x: [0.2, 0.8], y: [0, 1] } // shrink width horizontally
        }
    ], {
        ...theme,
        title: 'Macro Nutrient Distribution',
        margin: { t: 50, b: 50, l: 50, r: 50 }
    });
    pieDiv.style.backgroundColor=isDark?'#1e1e1e':'#ffffff';
    pieDiv.style.border="1px solid #ccc";
    pieDiv.style.borderRadius="5px";
    pieDiv.style.marginBottom="15px";

    // ---------- Box Plot ----------
    const boxTraces = nutrients.map(n=>{
        return {y: clusterData.all[n], name:n, type:'box'};
    });
    Plotly.newPlot(boxDiv, boxTraces, {...theme, title:'Cluster Nutrient Distribution'});
    boxDiv.style.backgroundColor=isDark?'#1e1e1e':'#ffffff';
    boxDiv.style.border="1px solid #ccc";
    boxDiv.style.borderRadius="5px";
    boxDiv.style.marginBottom="15px";
}