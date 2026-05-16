Food Clustering Web Application:
A Flask web application for clustering food items based on nutritional information using unsupervised machine learning. The app supports PCA visualization, K-Means clustering, and DBSCAN clustering, and allows users to explore, predict, and download clustered data.

Features:
1. Data Visualization
	- Principal Component Analysis (PCA) scatterplots
	- Clustered scatterplots for K-Means and DBSCAN

2. Clustering Algorithms
	- K-Means for grouping similar foods
	- DBSCAN for density-based clustering

3. Prediction Interface
	- Input nutritional values to predict K-Means cluster membership

4. Data Management
	- Download cleaned datasets
	- Re-cluster using different parameters

5. Interactive Charts
	- Dynamic charts using Plotly and D3.js
	- Supports zoom, hover, and cluster highlighting

6. Installation
	- Google drive access: https://drive.google.com/drive/folders/1YYpo_P0rw2T4Vm8ajFDAth1WdX6qwP8r?usp=drive_link
	- Unzip folder(RSW2S1G4 - TingRongYouYongChongXinWanZiKang) that is submitted to google classroom to get UML folder

How It Works:
1. Data Loading & Cleaning
	- The app reads a dataset of food items with nutritional information.
	- Performs cleaning: removes duplicates, handles missing values, and checks for outliers.

2. Dimensionality Reduction (PCA)
	- Reduces the high-dimensional nutritional data into 2 principal components.
	- Makes visualization and clustering easier by capturing the most variance.

3. Clustering Algorithms
	- K-Means: Partitions the dataset into k clusters by minimizing intra-cluster variance.
	- DBSCAN: Groups foods based on density, detecting clusters of varying shapes and outliers.

4. Cluster Prediction
	- Users can input nutritional values for a new food item.
	- The app predicts which K-Means cluster it belongs to based on trained centroids.

5. Visualization & Interaction
	- PCA and cluster scatterplots allow interactive exploration of food groups.
	- Users can hover over points, zoom in/out, and compare clusters.


Usage:
Run the Flask app: python app.py

Open in browser:
http://127.0.0.1:5000/


Navigate through the app:
PCA visualization
Calories vs Protein
K-Means prediction (Original) / K-Means prediction (Cleaned)

To stop:
Go to dropdown kernel, choose interrupt kernel

Project Structure
UML/
├─ app.py                 											# Main Flask application
├─ NutritionalBasedFoodSegmentation.ipynb	   											# Jupyter Notebook
├─ original_data/
│  └─ nutrients_csvfile.csv  										# Dataset
├─ preprocessed_data/
│  └─ scaled_df.csv 	    										# Scaled Dataset (With outliers)
│  └─ scaled_df_clean.csv  										# Scaled Dataset (Without outliers)
├─ clusetered_data/
│  └─ clustered_data_dbscan 	   									# DBSCAN Clustered data
│      └─ cluster_summary_dbscann.csv  			
│      └─ clustered_nutrition_data_dbscan.csv  	
│  └─ clustered_data_hierarchical 	    							# Hierarchical Clustered data
│      └─ with_outlier			
│      		└─ cluster_summary_hier_with_outlier.csv  			
│      		└─ nutrients_clustered_hier_with_outlier.csv  	
│      └─ without_outlier
│      		└─ cluster_summary_hier_without_outlier.csv  			
│      		└─ nutrients_clustered_hier_without_outlier.csv  	
│  └─ clustered_data_kmeans 	   									# KMeans Clustered data
│      └─ cluster_summary.csv  			
│      └─ clustered_nutrition_data.csv  		
├─ templates/             											# HTML templates
│  ├─ layout.html
│  ├─ pca.html
│  ├─ scatter.html
│  └─ kmeans_predict_original.html
│  └─ kmeans_predict_clean.html
├─ static/
│  ├─ style.css       												# Styling
│  └─ plot.js                 										# JS scripts for charts & interaction
│  └─ kmeans_predict.js
└─ ReaDMe.txt


Dependencies:
Python 3.10+
Flask
pandas, numpy
scikit-learn
matplotlib, seaborn
plotly, d3.js


License:
This project is licensed under the MIT License.
