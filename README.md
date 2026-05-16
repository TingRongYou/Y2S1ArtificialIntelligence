# Nutritional Food Segmentation - Unsupervised Machine Learning Web App 🍏🥦

A full-stack interactive data science web application that performs cluster-based segmentation of food items based on their comprehensive nutritional profiles. This project was engineered for the BMCS2203 Artificial Intelligence assignment to research, evaluate, and deploy multiple unsupervised machine learning algorithms alongside dynamic data visualizations.

## 🚀 Project Overview
Discovering macro- and micro-nutrient taxonomies is crucial for modern dietary planning and healthcare informatics. This project combines advanced data analytics with web deployment by embedding an unsupervised machine learning backend within an interactive Python Flask web interface. 

Rather than relying on flat static charts, the system processes a multi-dimensional nutritional dataset, reduces components via Principal Component Analysis (PCA), clusters the objects across several vector structures, and provides a real-time estimation engine for projecting the profile category of unlisted food elements.

## ✨ Key Features

* **Multi-Algorithm Unsupervised Learning Suite:**
  * **K-Means Clustering:** Minimizes intra-cluster variance to create distinct, distance-based food category profiles.
  * **DBSCAN (Density-Based Clustering):** Evaluates dense nutritional spaces to discover arbitrary cluster structures and robustly isolate dietary anomalies/outliers.
  * **Hierarchical Agglomerative Clustering:** Maps structural linkages and matrix taxonomies using dendrogram analysis.
* **Dimensionality Reduction & Feature Scaling:** Implements automated data cleaning pipelines involving dual-track preprocessing (with vs. without outlier elimination) and standardizes high-dimensional spaces down into principal components using **PCA** for lightweight rendering.
* **Interactive Full-Stack Dashboards:** Utilizes a highly animated data frontend backed by **Plotly** and **D3.js** script charts supporting selective zooming, responsive hovers, real-time tracking, and categorical color-coding.
* **Intelligent Real-Time Predictive Interface:** Allows consumers or research analysts to manually input nutritional macro targets (e.g., Calories, Protein, Fats) and immediately forecast which K-Means nutritional cluster the food belongs to.
* **Data Management Framework:** Facilitates granular downloading and exploration of processed subsets (`scaled_df.csv` and `scaled_df_clean.csv`) across varied algorithmic hyperparameter runs.

## 🛠️ Tech Stack & Dependencies

* **Backend Core:** Python 3.10+, Flask Web Framework
* **Data Science & Modeling:** `scikit-learn`, `pandas`, `numpy`, `scipy`
* **Visualization Engines:** `plotly`, `d3.js`, `matplotlib`, `seaborn`
* **Frontend Architecture:** Interactive HTML5, CSS3 Custom Theme Layouts, Vanilla JavaScript (ES6)

## 📁 Project Directory Structure

```text
UML/
├── app.py                                      # Main Flask Application & Web Controller
├── NutritionalBasedFoodSegmentation.ipynb     # Research Jupyter Notebook (EDA, Centroids, Models)
├── original_data/
│   └── nutrients_csvfile.csv                  # Master Raw Nutritional Dataset
├── preprocessed_data/
│   ├── scaled_df.csv                          # Normalized Dataset (With Outliers Retained)
│   └── scaled_df_clean.csv                    # Normalized Dataset (Outliers Purged)
├── clustered_data/
│   ├── clustered_data_dbscan/                 # DBSCAN Engine Evaluation Outputs
│   │   ├── cluster_summary_dbscan.csv
│   │   └── clustered_nutrition_data_dbscan.csv
│   ├── clustered_data_hierarchical/           # Hierarchical Matrix Links (Dual Tracks)
│   │   ├── with_outlier/
│   │   │   ├── cluster_summary_hier_with_outlier.csv
│   │   │   └── nutrients_clustered_hier_with_outlier.csv
│   │   └── without_outlier/
│   │       ├── cluster_summary_hier_without_outlier.csv
│   │       └── nutrients_clustered_hier_without_outlier.csv
│   └── clustered_data_kmeans/                 # K-Means Segmented Matrices & Summaries
│       ├── cluster_summary.csv
│       └── clustered_nutrition_data.csv
├── templates/                                 # HTML Frontend Views
│   ├── layout.html                            # Master Frame Blueprint
│   ├── pca.html                               # Principal Component Projections View
│   ├── scatter.html                           # Multi-Variable Scatter charts (Calories vs Protein)
│   ├── kmeans_predict_original.html           # Prediction Suite (Raw Track)
│   └── kmeans_predict_clean.html              # Prediction Suite (Cleaned Track)
└── static/                                    # UI Assets & Interactivity Clients
    ├── style.css                              # Custom System Styling stylesheet
    ├── plot.js                                # JS Scripting client for chart animations
    └── kmeans_predict.js                      # Async Client Handling Prediction queries
```

## ⚙️ Installation & How to Run
1. Environment Setup
   Clone or extract the project workspace (UML folder), navigate to the directory terminal, and ensures your dependencies are configured:
   ```bash
   pip install flask pandas numpy scikit-learn matplotlib seaborn plotly
   ```
2. Booting the Application Service
   Execute the primary control server file using Python
   ```bash
   python app.py
   ```
3. Accessing the System Dashboard
   Open your choice of browser and access the local server port address:
   ```text
   http://127.0.0.1:5000/
   ```

_Use the top navbar controls to shift fluidly between PCA Visualization, Calories vs Protein analytical profiles, and the live K-Means Prediction Engine Panels._

## 👨‍💻 Authors
* **Ting Rong You**
* **Yong Chong Xin**
* **Wan Zi Kang**

_Bachelor of Software Engineering (Honours)_

_Tunku Abdul Rahman University of Management and Technology (TARUMT)_

_Year 2 Semester 1 — Artificial Intelligence Practical Course Assignment_
