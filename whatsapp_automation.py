import csv
import os
import time
import pyautogui
import pywhatkit as kit

def send_whatsapp_reminders():
    store_link = "https://in.oriflame.com/products/digital-catalogue-current?store=IN-goldenstar"
    csv_file = "inactive_members.csv"
    
    if not os.path.exists(csv_file):
        print(f"❌ Error: '{csv_file}' file paowa jayni.")
        return
        
    with open(csv_file, "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        count = 0
        
        for row in reader:
            name = row.get("Name", "Valued Customer").strip()
            phone = row.get("Phone", "").strip()
            
            if not phone:
                continue
                
            if not phone.startswith("+91"):
                clean_phone = "".join(filter(str.isdigit, phone))
                if len(clean_phone) == 10:
                    phone_formatted = f"+91{clean_phone}"
                else:
                    phone_formatted = f"+{clean_phone}"
            else:
                phone_formatted = phone
                
            message = (
                f"Hi {name}, we missed you at Oriflame! ✨ "
                f"Check out our latest digital catalogue now and enjoy an instant "
                f"flat ₹500 discount on purchases above ₹3,000! 🛍️\n\n"
                f"Browse and shop here: {store_link}"
            )
            
            print(f"\n📲 [{count+1}] Opening WhatsApp Web for {name} ({phone_formatted})...")
            
            try:
                # Open WhatsApp Web chat link
                kit.sendwhatmsg_instantly(
                    phone_no=phone_formatted,
                    message=message,
                    wait_time=12,
                    tab_close=False
                )
                
                # Wait for WhatsApp text box to focus & load completely
                time.sleep(5)
                
                # Force click on the center of the screen to activate Chrome/Browser window
                screen_width, screen_height = pyautogui.size()
                pyautogui.click(screen_width // 2, screen_height // 2)
                time.sleep(1)
                
                # Press Enter key automatically to send the message
                pyautogui.press('enter')
                print(f"✅ Message auto-sent successfully to {name}!")
                
                print("⏳ Waiting 8 seconds before next contact...")
                time.sleep(8)
                count += 1

            except Exception as e:
                print(f"❌ Error sending to {name}: {e}")
            
        print(f"\n🎉 Process completed! Total {count} WhatsApp messages processed.")

if __name__ == "__main__":
    send_whatsapp_reminders()