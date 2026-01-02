def predict_days_to_reach(daily_amounts, current_stock, required_stock):
    avg_daily = sum(daily_amounts) / len(daily_amounts)
    remaining = required_stock - current_stock
    if avg_daily <= 0:
        return None
    days_needed = remaining / avg_daily
    return round(days_needed)

def auction_decision(current_stock, required_stock):
    percentage = (current_stock / required_stock) * 100
    if percentage >= 90:
        return "OPEN_AUCTION"
    else:
        return "WAIT"

def select_best_bid(bids):
    best_bid = None
    best_score = -1
    for bid in bids:
        transport_cost = bid['distance'] * 0.05
        score = bid['price'] - transport_cost
        if score > best_score:
            best_score = score
            best_bid = bid
    return best_bid
