from flask import Flask, request, jsonify
from ai_module import predict_days_to_reach, auction_decision, select_best_bid

app = Flask(__name__)

@app.route('/ai/decision', methods=['POST'])
def ai_decision():
    data = request.json

    days = predict_days_to_reach(
        data['daily_amounts'],
        data['current_stock'],
        data['required_stock']
    )

    auction = auction_decision(
        data['current_stock'],
        data['required_stock']
    )

    best_bid = select_best_bid(data['bids'])

    return jsonify({
        "days_needed": days,
        "auction_status": auction,
        "best_bid": best_bid
    })

if __name__ == '__main__':
    app.run(port=5001)
