# app.py
from flask import Flask, render_template, jsonify, request, send_file
import threading, webbrowser, os
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans, DBSCAN
import numpy as np

app = Flask(__name__)

# -------------------------------------------------------
# Configuration
# -------------------------------------------------------
FEATURE_COLS = ['Calories', 'Protein', 'Fat', 'Fiber', 'Carbs']
KMEANS_N_CLUSTERS = 3

# -------------------------------------------------------
# Load & basic cleaning
# -------------------------------------------------------
raw_path = "original_data/nutrients_csvfile.csv"
nutrients = pd.read_csv(raw_path)

# Clean text values in numeric columns
text_replacements = ["t", "t'"]
for c in FEATURE_COLS:
    if c in nutrients.columns:
        nutrients[c] = nutrients[c].replace(text_replacements, 0)

nutrients = nutrients.replace(",", "", regex=True)
if 'Fiber' in nutrients.columns:
    nutrients['Fiber'] = nutrients['Fiber'].replace("a", "", regex=True)

num_cols_all = ['Grams', 'Calories', 'Protein', 'Fat', 'Fiber', 'Carbs']
present_num_cols = [c for c in num_cols_all if c in nutrients.columns]
nutrients[present_num_cols] = nutrients[present_num_cols].apply(pd.to_numeric, errors='coerce')

present_required = [c for c in FEATURE_COLS if c in nutrients.columns]
nutrients = nutrients.dropna(subset=present_required)

if 'Protein' in nutrients.columns:
    nutrients.loc[nutrients['Protein'] < 0, 'Protein'] = nutrients['Protein'].median()

# -------------------------------------------------------
# Remove outliers function
# -------------------------------------------------------
def remove_outliers_iqr(df, cols):
    df2 = df.copy()
    for col in cols:
        if col not in df2.columns or df2[col].isna().all():
            continue
        Q1 = df2[col].quantile(0.25)
        Q3 = df2[col].quantile(0.75)
        IQR = Q3 - Q1
        if pd.isna(IQR) or IQR == 0:
            continue
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        df2 = df2[(df2[col] >= lower) & (df2[col] <= upper)]
    return df2

clean_nutrients = remove_outliers_iqr(nutrients, FEATURE_COLS)
clean_nutrients = clean_nutrients.dropna(subset=present_required)

# -------------------------------------------------------
# KMeans with feature weighting and robust labeling
# -------------------------------------------------------
def train_kmeans_weighted(df, n_clusters=KMEANS_N_CLUSTERS):
    df_k = df.copy()
    X = df_k[FEATURE_COLS].astype(float)

    # Step 1: Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Step 2: Apply feature weights
    weight_map = {'Calories': 1.5, 'Protein': 2.5, 'Fat': 2.0, 'Fiber': 2.0, 'Carbs': 1.0}
    for i, col in enumerate(FEATURE_COLS):
        if col in weight_map:
            X_scaled[:, i] *= weight_map[col]

    # Step 3: Clip extreme values
    X_scaled = np.clip(X_scaled, -3, 3)

    # Step 4: Fit KMeans
    kmeans = KMeans(n_clusters=n_clusters, init='k-means++', n_init=50, max_iter=500, random_state=42)
    kmeans.fit(X_scaled)
    df_k['KMeans_Label'] = kmeans.labels_

    # Step 5: Robust cluster labeling
    centroids = scaler.inverse_transform(
        kmeans.cluster_centers_ / np.array([weight_map[c] for c in FEATURE_COLS])
    )
    cluster_sums = []
    for c in centroids:
        cal, prot, fat, fiber, carbs = c
        cluster_sums.append((cal + fat, prot + fiber, c))

    cluster_sums_sorted = sorted(enumerate(cluster_sums), key=lambda x: (x[1][0], x[1][1]))
    labels = {}
    predefined_labels = ['Protein-Fiber Rich', 'Balanced Nutrition', 'High-Energy Dense']
    for idx, (cluster_idx, (_, _, centroid_vals)) in enumerate(cluster_sums_sorted):
        labels[cluster_idx] = f"{predefined_labels[idx]} (Cluster {cluster_idx})"

    debug_info = {
        "training_counts": df_k['KMeans_Label'].value_counts().to_dict(),
        "cluster_labels": labels,
        "centroids": centroids.tolist()
    }

    print("\n--- KMeans Debug Info ---", debug_info)
    return kmeans, scaler, labels, df_k, debug_info

# Train KMeans
kmeans_model_original, scaler_original, cluster_labels_original, nutrients, debug_orig = train_kmeans_weighted(nutrients)
kmeans_model_clean, scaler_clean, cluster_labels_clean, clean_nutrients, debug_clean = train_kmeans_weighted(clean_nutrients)

# -------------------------------------------------------
# DBSCAN with same scaling/weighting/clipping as KMeans
# -------------------------------------------------------
def run_dbscan(eps_value=0.35, min_samples=5):
    df_db = clean_nutrients.copy()
    X = df_db[FEATURE_COLS].astype(float)

    # Step 1: Scale
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Step 2: Apply weights
    weight_map = {'Calories': 1.5, 'Protein': 2.5, 'Fat': 2.0, 'Fiber': 2.0, 'Carbs': 1.0}
    for i, col in enumerate(FEATURE_COLS):
        if col in weight_map:
            X_scaled[:, i] *= weight_map[col]

    # Step 3: Clip
    X_scaled = np.clip(X_scaled, -3, 3)

    # Step 4: DBSCAN
    dbscan_model = DBSCAN(eps=eps_value, min_samples=min_samples)
    db_labels = dbscan_model.fit_predict(X_scaled)

    df_db['Cluster'] = db_labels

    # Step 5: PCA for visualization
    pca_result = PCA(n_components=2).fit_transform(X_scaled)
    return df_db, pca_result

nutrients_db, pca_result = run_dbscan()

# -------------------------------------------------------
# KMeans prediction helper
# -------------------------------------------------------
def predict_kmeans(user_input, model, scaler, labels_map):
    input_df = pd.DataFrame([user_input])[FEATURE_COLS].astype(float)
    weight_map = {'Calories': 1.5, 'Protein': 2.5, 'Fat': 2.0, 'Fiber': 2.0, 'Carbs': 1.0}

    input_scaled = scaler.transform(input_df)
    for i, col in enumerate(FEATURE_COLS):
        if col in weight_map:
            input_scaled[:, i] *= weight_map[col]
    input_scaled = np.clip(input_scaled, -3, 3)

    cluster_id = int(model.predict(input_scaled)[0])
    cluster_name = labels_map.get(cluster_id, f"Cluster {cluster_id}")
    distances = model.transform(input_scaled)[0]
    confidence = 1 / (1 + distances[cluster_id])

    return {
        "cluster_id": cluster_id,
        "cluster_name": cluster_name,
        "confidence": float(confidence),
        "distances_to_centroids": distances.tolist()
    }

# -------------------------------------------------------
# Flask routes
# -------------------------------------------------------
@app.route('/')
def home(): 
    return render_template('pca.html')

@app.route('/pca')
def pca_page(): 
    return render_template('pca.html')

@app.route('/scatter')
def scatter_page(): 
    return render_template('scatter.html')

@app.route('/kmeans_predict')
def kmeans_predict_page(): 
    return render_template('kmeans_predict_clean.html')

@app.route('/kmeans_predict_original')
def kmeans_predict_original_page(): 
    return render_template('kmeans_predict_original.html')

@app.route('/kmeans_predict_clean')
def kmeans_predict_clean_page(): 
    return render_template('kmeans_predict_clean.html')

@app.route('/data')
def data():
    pca_df = pd.DataFrame(pca_result, columns=['PCA1','PCA2'])
    pca_df['Cluster'] = nutrients_db['Cluster'].values
    pca_df['Food'] = clean_nutrients.get('Food', pd.Series([""]*len(pca_df))).values
    pca_df['Category'] = clean_nutrients.get('Category', pd.Series([""]*len(pca_df))).values
    for col in FEATURE_COLS:
        if col in clean_nutrients.columns:
            pca_df[col] = clean_nutrients[col].values
    return jsonify(pca_df.to_dict(orient='records'))

@app.route('/summary')
def summary():
    cluster_counts = nutrients_db['Cluster'].value_counts().to_dict()
    num_clusters = len([c for c in cluster_counts.keys() if c != -1])
    num_noise = cluster_counts.get(-1,0)
    total = len(nutrients_db)
    noise_pct = round((num_noise/total)*100,2) if total>0 else 0.0
    return jsonify({
        "num_clusters": num_clusters,
        "num_noise": num_noise,
        "noise_pct": noise_pct,
        "cluster_sizes": {int(k):int(v) for k,v in cluster_counts.items()}
    })

@app.route('/recluster', methods=['POST'])
def recluster():
    global nutrients_db, pca_result
    data_req = request.get_json()
    try:
        eps_value = float(data_req.get("eps",0.35))
        min_samples = int(data_req.get("min_samples",5))
    except:
        return jsonify({"error":"Invalid parameters"}),400
    nutrients_db, pca_result = run_dbscan(eps_value,min_samples)
    return jsonify({"message":"DBSCAN updated","eps":eps_value,"min_samples":min_samples})

# ----------------- KMeans prediction routes -----------------
@app.route('/predict_kmeans_original', methods=['POST'])
def predict_cluster_original():
    data_req = request.get_json()
    if not data_req:
        return jsonify({"error": "No input"}), 400

    result = predict_kmeans(data_req, kmeans_model_original, scaler_original, cluster_labels_original)
    cluster_id = result["cluster_id"]
    df = nutrients
    if 'KMeans_Label' not in df.columns:
        df['KMeans_Label'] = kmeans_model_original.predict(scaler_original.transform(df[FEATURE_COLS]))
    cluster_avg_df = df[df['KMeans_Label'] == cluster_id][FEATURE_COLS]
    cluster_avg = cluster_avg_df.mean().to_dict()
    result.update({"cluster_avg": cluster_avg})
    return jsonify(result)

@app.route('/predict_kmeans_clean', methods=['POST'])
def predict_cluster_clean():
    data_req = request.get_json()
    if not data_req:
        return jsonify({"error": "No input"}), 400

    result = predict_kmeans(data_req, kmeans_model_clean, scaler_clean, cluster_labels_clean)
    cluster_id = result["cluster_id"]
    df = clean_nutrients
    if 'KMeans_Label' not in df.columns:
        df['KMeans_Label'] = kmeans_model_clean.predict(scaler_clean.transform(df[FEATURE_COLS]))
    cluster_avg_df = df[df['KMeans_Label'] == cluster_id][FEATURE_COLS]
    cluster_avg = cluster_avg_df.mean().to_dict()
    result.update({"cluster_avg": cluster_avg})
    return jsonify(result)

@app.route('/download')
def download():
    export_folder = os.path.join("clustered_data","clustered_data_dbscan")
    os.makedirs(export_folder, exist_ok=True)
    clustered_data_file = os.path.join(export_folder,"clustered_nutrition_data_dbscan.csv")
    nutrients_db.to_csv(clustered_data_file, index=False)
    return send_file(clustered_data_file, as_attachment=True)

@app.route('/cluster_data/<int:cluster_id>')
def cluster_data(cluster_id):
    dataset = request.args.get("dataset","clean")
    df = clean_nutrients if dataset=="clean" else nutrients
    try:
        if 'KMeans_Label' not in df.columns:
            scaler = scaler_clean if dataset=="clean" else scaler_original
            model = kmeans_model_clean if dataset=="clean" else kmeans_model_original
            df['KMeans_Label'] = model.predict(scaler.transform(df[FEATURE_COLS]))
        cluster_df = df[df['KMeans_Label']==cluster_id]
        avg_vals = {c: cluster_df[c].mean() for c in FEATURE_COLS}
        all_vals = {c: cluster_df[c].tolist() for c in FEATURE_COLS}
        name_map = cluster_labels_clean if dataset=="clean" else cluster_labels_original
        return jsonify({"name":name_map.get(cluster_id,f"Cluster {cluster_id}"),"avg":avg_vals,"all":all_vals})
    except Exception as e:
        return jsonify({"error":str(e)})

# -------------------------------------------------------
# Run server
# -------------------------------------------------------
def run_flask_with_browser():
    threading.Timer(1.0, lambda: webbrowser.open("http://127.0.0.1:5000/")).start()
    app.run(debug=True, port=5000, use_reloader=False)

if __name__ == '__main__':
    run_flask_with_browser()