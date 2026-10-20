import os
import subprocess

def run_next_campaign():
    folder_path = "inactive_lists"
    
    if not os.path.exists(folder_path):
        print(f"❌ Error: '{folder_path}' folder-ti paowa jayni! Age split_files.py run korun.")
        return

    # 'inactive_lists' ফোল্ডারের সব ফাইল খুঁজে বের করা
    files = sorted([f for f in os.listdir(folder_path) if f.startswith("inactive_") and f.endswith(".csv")])
    
    if not files:
        print("❌ Error: Kono batch file paowa jayni!")
        return

    target_file = None

    # চেক করা যাক কোন ফাইলটি এখনো পাঠানো হয়নি (যেগুলোর সাথে 'failed_' বা শেষ হয়নি)
    for file_name in files:
        full_path = os.path.join(folder_path, file_name)
        # আমরা ফোল্ডারে একটি প্রোগ্রেস ট্র্যাক বা চেক করতে পারি
        # অথবা সিম্পলি সিরিয়ালের প্রথম ফাইলটি নিতে পারি
        target_file = full_path
        break # প্রথম ফাইলটি সিলেক্ট করে ব্রেক করবে

    if target_file:
        print(f"🚀 Automatically starting campaign for: {target_file}")
        # whatsapp_selenium.py স্ক্রিপ্টটি এই ফাইলের নাম নিয়ে রান হবে
        subprocess.run(["python", "whatsapp_selenium.py", target_file])
        
        # কাজ শেষে এই ফাইলটি ব্যাকআপ বা প্রসেসড ফোল্ডারে সরিয়ে নিতে পারেন যাতে পরের দিন পরের ফাইল ধরে
        # অথবা আপনি ফাইলটি ডিলিটও করে দিতে পারেন
        # os.remove(target_file) 
    else:
        print("🎉 Shob gulo campaign sesh!")

if __name__ == "__main__":
    run_next_campaign()