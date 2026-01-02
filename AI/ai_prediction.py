import requests
import pandas as pd
from datetime import datetime, timedelta

# =========================
# CONFIG
# =========================
BACKEND_URL = "http://localhost:5000/waste"
WASTE_TYPE = "organic"
THRESHOLD = 500   # الحد الأدنى اللي المصنع يقبله (مثلاً 500 كجم)



AUCTION_URL = "http://localhost:5000/auction/open"

def open_auction(total_quantity):
    payload = {
        "wasteType": WASTE_TYPE,
        "totalQuantity": total_quantity
    }
    requests.post(AUCTION_URL, json=payload)

# =========================
# FETCH DATA FROM BACKEND
# =========================
def fetch_waste_data():
    response = requests.get(BACKEND_URL)
    data = response.json()
    return data

# =========================
# FILTER DATA BY TYPE
# =========================
def filter_by_type(data, waste_type):
    filtered = [w for w in data if w["type"] == waste_type]
    return filtered

# =========================
# CALCULATE DAILY RATE
# =========================
def calculate_daily_rate(data):
    df = pd.DataFrame(data)
    df["createdAt"] = pd.to_datetime(df["createdAt"])

    df["date"] = df["createdAt"].dt.date
    daily_sum = df.groupby("date")["quantity"].sum()

    daily_rate = daily_sum.mean()
    return daily_rate

# =========================
# PREDICTION
# =========================
def predict_days_left(current_quantity, daily_rate):
    if daily_rate == 0:
        return None
    remaining = THRESHOLD - current_quantity
    days = remaining / daily_rate
    return max(0, round(days))

# =========================
# MAIN AI LOGIC
# =========================
def run_ai():
    data = fetch_waste_data()
    filtered_data = filter_by_type(data, WASTE_TYPE)

    if not filtered_data:
        print(" No data available")
        return

    total_quantity = sum(w["quantity"] for w in filtered_data)
    daily_rate = calculate_daily_rate(filtered_data)
    days_left = predict_days_left(total_quantity, daily_rate)

    print("===== AI WASTE ANALYSIS =====")
    print(f"Waste Type       : {WASTE_TYPE}")
    print(f"Total Quantity   : {total_quantity} kg")
    print(f"Daily Rate       : {round(daily_rate, 2)} kg/day")

    if total_quantity >= THRESHOLD:
        print(" Threshold reached!")
        print(" Action: OPEN AUCTION & NOTIFY FACTORIES")
    else:
        print(f" Estimated days to reach threshold: {days_left} days")

# =========================
# RUN
# =========================
if __name__ == "__main__":
    run_ai()
