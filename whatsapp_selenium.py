import csv
import os
import time
import sys
from urllib.parse import quote
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def create_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-notifications")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    
    session_dir = os.path.join(os.getcwd(), "whatsapp_chrome_session")
    options.add_argument(f"user-data-dir={session_dir}")
    
    driver = webdriver.Chrome(options=options)
    return driver

def send_whatsapp_bulk():
    store_link = "https://in.oriflame.com/products/digital-catalogue-current?store=IN-goldenstar"
    
    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
    else:
        csv_file = "inactive_members.csv"
        
    failed_file = f"failed_{csv_file}"
    
    if not os.path.exists(csv_file):
        print(f"❌ Error: '{csv_file}' file paowa jayni.")
        return

    # Read CSV as pure rows (Index 0: Name, Index 1: Phone)
    try:
        with open(csv_file, "r", encoding="utf-8-sig") as file:
            reader = list(csv.reader(file))
    except Exception as e:
        print(f"❌ CSV File Read Error: {e}")
        return
        
    if not reader:
        print(f"❌ Error: '{csv_file}' file-ti khali!")
        return

    # Skip header if it exists
    start_index = 0
    first_row_text = "".join(reader[0]).lower()
    if "name" in first_row_text or "phone" in first_row_text or "mobile" in first_row_text:
        start_index = 1

    members_list = reader[start_index:]
    total_members = len(members_list)

    if total_members == 0:
        print(f"❌ Error: '{csv_file}' e kono member-er data paowa jayni!")
        return

    print(f"\n📁 Total members found: {total_members}")

    # Reset/Create failed members CSV file
    with open(failed_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Name", "Phone", "Reason"])

    success_count = 0
    fail_count = 0

    driver = create_driver()
    print("\n🌐 Opening WhatsApp Web...")
    driver.get("https://web.whatsapp.com")
    time.sleep(12)

    for i, row in enumerate(members_list):
        if len(row) < 2:
            continue
            
        name = row[0].strip()
        phone = row[1].strip()
        
        if not phone:
            continue
            
        clean_phone = "".join(filter(str.isdigit, phone))
        if len(clean_phone) == 10:
            phone_formatted = f"91{clean_phone}"
        else:
            phone_formatted = clean_phone
            
        message = (
            f"Hi {name}, we missed you at Oriflame! ✨ "
            f"Check out our latest digital catalogue now and enjoy an instant "
            f"flat ₹500 discount on purchases above ₹3,000! 🛍️\n\n"
            f"Browse and shop here: {store_link}"
        )
        
        encoded_message = quote(message)
        whatsapp_url = f"https://web.whatsapp.com/send?phone={phone_formatted}&text={encoded_message}"
        
        # Memory protection: Refresh browser session every 25 messages
        if i > 0 and i % 25 == 0:
            print("\n🔄 Memory refresh: Restarting browser session...")
            try:
                driver.quit()
            except:
                pass
            time.sleep(3)
            driver = create_driver()
            driver.get("https://web.whatsapp.com")
            time.sleep(15)
        
        try:
            print(f"\n📲 [{i+1}/{total_members}] Processing: {name} ({phone_formatted})...")
            driver.get(whatsapp_url)
            # Increased wait time for safe chat loading
            time.sleep(15)

            sent_successfully = False

            try:
                send_btn = WebDriverWait(driver, 15).until(
                    EC.element_to_be_clickable((By.XPATH, '//span[@data-icon="send"]'))
                )
                time.sleep(1)
                send_btn.click()
                sent_successfully = True
            except Exception:
                try:
                    msg_box = WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.XPATH, '//div[@contenteditable="true"][@data-tab="10"]'))
                    )
                    msg_box.send_keys(Keys.ENTER)
                    sent_successfully = True
                except Exception:
                    sent_successfully = False

            if sent_successfully:
                print(f"✅ Message Auto-Sent to {name}!")
                success_count += 1
                # Increased gap after sending message to mimic human behavior
                time.sleep(12)
            else:
                raise Exception("Send button or Enter key failed")

        except Exception as outer_err:
            print(f"❌ Failed / Error for {name}: {outer_err}")
            fail_count += 1
            with open(failed_file, "a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow([name, phone, "Connection Error, No WhatsApp, or Timeout"])
            time.sleep(2)

    try:
        driver.quit()
    except:
        pass

    print(f"\n🎉 Process Finished for {csv_file}!")
    print(f"✔️ Successfully Sent: {success_count}")
    print(f"❌ Failed / Saved in '{failed_file}': {fail_count}")

if __name__ == "__main__":
    send_whatsapp_bulk()