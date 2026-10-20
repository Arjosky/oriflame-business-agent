import csv
import os
import requests

def send_inactive_reminders():
    store_link = "https://in.oriflame.com/products/digital-catalogue-current?store=IN-goldenstar"
    csv_file = "inactive_members.csv"
    API_KEY = "hMtcden1F05oEiyvHmlpWG2NuUbaKCXqx9DRsJV3kT8ZgOQLzI2Dtsrxhnz3oTG0eAFIm5fiYJBpUu16"
    
    if not os.path.exists(csv_file):
        print(f"❌ Error: '{csv_file}' file paowa jayni. Name ebong Phone column diye file-ti toiri korun.")
        return
        
    with open(csv_file, "r") as file:
        reader = csv.DictReader(file)
        count = 0
        for row in reader:
            name = row.get("Name", "Valued Customer")
            phone = row.get("Phone", "").strip()
            
            if not phone:
                continue
                
            message = (
                f"Hi {name}, we missed you at Oriflame! ✨ "
                f"Check out our latest digital catalogue now and enjoy an instant "
                f"flat ₹500 discount on purchases above ₹3,000! 🛍️ "
                f"Shop here: {store_link}"
            )
            
            url = "https://www.fast2sms.com/dev/bulkV2"
            payload = {
                "route": "q",
                "message": message,
                "language": "english",
                "flash": 0,
                "numbers": phone
            }
            headers = {
                'authorization': API_KEY,
                'content-type': "application/x-www-form-urlencoded"
            }
            
            try:
                response = requests.post(url, data=payload, headers=headers)
                res_data = response.json()
                if res_data.get("return"):
                    print(f"✅ SMS successfully sent to {name} ({phone})")
                else:
                    print(f"❌ Failed to send SMS to {phone}: {res_data.get('message')}")
            except Exception as e:
                print(f"⚠️ Error sending SMS to {phone}: {e}")
                
            count += 1
            
        print(f"\n🎉 Total {count} inactive members processed!")

if __name__ == "__main__":
    send_inactive_reminders()