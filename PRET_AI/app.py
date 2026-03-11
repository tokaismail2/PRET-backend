import pandas as pd
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from sklearn.linear_model import LinearRegression
from datetime import datetime
from dateutil.relativedelta import relativedelta
from PIL import Image
import io

app = Flask(__name__)

try:
    # استخدام compile=False ضروري جداً لتجنب خطأ DepthwiseConv2D
    model = tf.keras.models.load_model('models/keras_model.h5', compile=False)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Critical error loading model: {e}")

# دالة التصنيف (Inference logic)
def predict_waste_type(image_file):
    image = Image.open(image_file).convert('RGB')
    image = image.resize((224, 224))
    image_array = np.asarray(image) / 255.0
    image_array = np.expand_dims(image_array, 0)
    
    prediction = model.predict(image_array)
    class_index = np.argmax(prediction)
    waste_types = ["Plastic", "Paper", "Oil"] # تأكدي من ترتيبها
    return waste_types[class_index]

@app.route('/classify_waste', methods=['POST'])
def classify_waste():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    image_file = request.files['image']
    result = predict_waste_type(image_file)
    return jsonify({'waste_type': result, 'status': 'success'})

@app.route('/predict_waste', methods=['GET'])
def get_prediction():
    # تحميل البيانات وإجراء الـ Regression
    data = pd.read_csv('waste_data.csv')
    data['Date'] = pd.to_datetime(data['Date'])
    data['Date_Ordinal'] = data['Date'].map(datetime.toordinal)
    
    reg = LinearRegression()
    reg.fit(data[['Date_Ordinal']], data['Amount_KG'])
    
    next_month = (datetime.now() + relativedelta(months=1)).replace(day=1)
    pred = reg.predict(np.array([[next_month.toordinal()]]))
    
    return jsonify({
        'target_date': next_month.strftime('%Y-%m-%d'),
        'predicted_amount': round(pred[0], 2)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)