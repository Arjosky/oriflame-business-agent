import csv
import os

def split_csv():
    source_file = "inactive_members.csv" 
    output_folder = "inactive_lists"  # Ekhane folder-er nam dewa holo
    
    # Folder na thakle automatic toiri kore nibe
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        
    if not os.path.exists(source_file):
        print(f"❌ Error: {source_file} file-ti paowa jayni!")
        return

    with open(source_file, "r", encoding="utf-8-sig") as f:
        reader = list(csv.reader(f))
        
    if not reader:
        print("❌ File-ti khali!")
        return

    header = reader[0]
    rows = reader[1:]
    
    chunk_size = 20
    file_count = 1

    for i in range(0, len(rows), chunk_size):
        chunk = rows[i:i + chunk_size]
        # File gulo 'inactive_lists' folder-er vitore save hobe
        output_filename = os.path.join(output_folder, f"inactive_{file_count}.csv")
        
        with open(output_filename, "w", newline="", encoding="utf-8") as out_f:
            writer = csv.writer(out_f)
            writer.writerow(header)
            writer.writerows(chunk)
            
        print(f"✅ Created: {output_filename} ({len(chunk)} contacts)")
        file_count += 1

    print("\n🎉 Shob gulo file 'inactive_lists' folder-er vitore 20-ta kore vag hoye geche!")

if __name__ == "__main__":
    split_csv()