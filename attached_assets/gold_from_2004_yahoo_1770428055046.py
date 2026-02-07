# gold_update_daily.py
# Updated version that handles yfinance-style CSV (date as index, no "Date" column)

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import os

# ────────────────────────────────────────────────
CSV_FILE = "gold_2004_to_now_GC_F.csv"
TICKER   = "GC=F"
# ────────────────────────────────────────────────

def update_gold_data():
    today = datetime.now().date()
    print(f"Today: {today}")

    # 1. Load existing data
    if os.path.exists(CSV_FILE):
        try:
            # Try to read with date as index (yfinance default style)
            df_existing = pd.read_csv(
                CSV_FILE,
                index_col=0,                # first column = date
                parse_dates=True
            )
            df_existing.index.name = 'Date'  # make sure it has a name
            df_existing.sort_index(inplace=True)
            last_date = df_existing.index.max().date()
            print(f"Existing data goes up to: {last_date}")
            start_fetch = last_date + timedelta(days=1)
        except Exception as e:
            print("Could not read existing CSV correctly:", e)
            print("Starting fresh download from 2004...")
            df_existing = pd.DataFrame()
            start_fetch = datetime(2004, 1, 1).date()
    else:
        print("No existing file → fetching from 2004")
        df_existing = pd.DataFrame()
        start_fetch = datetime(2004, 1, 1).date()

    # 2. Nothing to do if already up-to-date
    if start_fetch > today:
        print("Data is already up to date.")
        return

    print(f"Fetching new data from {start_fetch} to {today}...")

    # 3. Download only missing days
    new_data = yf.download(
        TICKER,
        start=start_fetch,
        end=today + timedelta(days=1),
        progress=False,
        auto_adjust=True
    )

    if new_data.empty:
        print("No new data available yet (possibly weekend/market closed).")
        return

    new_data = new_data[['Open', 'High', 'Low', 'Close', 'Volume']].round(2)

    # 4. Combine
    if not df_existing.empty:
        updated_df = pd.concat([df_existing, new_data])
    else:
        updated_df = new_data

    # Remove duplicates (keep latest)
    updated_df = updated_df[~updated_df.index.duplicated(keep='last')]

    # 5. Save — keep date as index (yfinance style)
    updated_df.to_csv(CSV_FILE)
    print(f"Updated successfully!")
    print(f"Total rows: {len(updated_df):,}")
    print(f"Latest date: {updated_df.index.max().date()}")
    print(f"Saved to: {CSV_FILE}")

if __name__ == "__main__":
    update_gold_data()