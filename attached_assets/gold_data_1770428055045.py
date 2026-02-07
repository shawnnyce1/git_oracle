# gold_data.py
from polygon import RESTClient
from datetime import datetime
import pandas as pd

# ────────────────────────────────────────────────
API_KEY = "r37aFrmgOfMZphPTMQi336fw_WLHLAUA"     # Your key
TICKER  = "C:XAUUSD"                               # Gold vs USD
# ────────────────────────────────────────────────

client = RESTClient(api_key=API_KEY)

# Try to fetch from 2004 to today (API will limit to available range)
start_date = "2004-01-01"
end_date   = datetime.now().strftime("%Y-%m-%d")

print(f"Requesting daily gold data from {start_date} to {end_date}...")
print("(Note: Polygon usually has only ~5–10 years of forex history)\n")

aggs = client.get_aggs(
    ticker=TICKER,
    multiplier=1,
    timespan="day",
    from_=start_date,
    to=end_date,
    adjusted=True,
    limit=50000                      # max allowed per request
)

if not aggs:
    print("No data returned at all.")
    print("Possible reasons:")
    print("• Free tier limitation")
    print("• Forex data does not go back to 2004")
    print("• Try a more recent start date (e.g. 2015-01-01)")
else:
    # Convert to pandas DataFrame for easy viewing/saving
    df = pd.DataFrame(aggs)
    df['date'] = pd.to_datetime(df['timestamp'], unit='ms').dt.strftime('%Y-%m-%d')
    df = df[['date', 'open', 'high', 'low', 'close', 'volume']]
    df.columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']

    print(f"Found {len(df)} daily bars")
    print(f"Earliest date: {df['Date'].min()}")
    print(f"Latest date:   {df['Date'].max()}\n")

    # Show first 8 and last 8 rows
    print("First few days:")
    print(df.head(8).to_string(index=False))
    print("\nLast few days:")
    print(df.tail(8).to_string(index=False))

    # Optional: Save to CSV
    df.to_csv("gold_historical_polygon.csv", index=False)
    print("\nData saved to: gold_historical_polygon.csv")