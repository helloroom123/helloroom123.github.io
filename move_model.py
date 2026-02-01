import os
import shutil

src_base = r"assets/live2d"
dst_base = r"assets/live2d/teto"

# Find the Japanese folder name dynamically to avoid encoding issues in script text if possible
# But we know it starts with '重音'
found = False
for d in os.listdir(src_base):
    if "重音" in d or "Teto" in d:
        full_path = os.path.join(src_base, d)
        if os.path.isdir(full_path) and d != "teto":
            print(f"Found folder: {d}")
            # Drill down
            vts_path = os.path.join(full_path, "VTS Model File")
            if os.path.exists(vts_path):
                inner_folders = os.listdir(vts_path)
                for inner in inner_folders:
                    inner_full = os.path.join(vts_path, inner)
                    if os.path.isdir(inner_full):
                        print(f"Found model root: {inner_full}")
                        # Move contents to teto
                        if not os.path.exists(dst_base):
                            os.makedirs(dst_base)
                        
                        for item in os.listdir(inner_full):
                            s = os.path.join(inner_full, item)
                            d = os.path.join(dst_base, item)
                            if os.path.exists(d):
                                if os.path.isdir(d):
                                    shutil.rmtree(d)
                                else:
                                    os.remove(d)
                            shutil.move(s, d)
                        print("Moved files successfully.")
                        found = True
                        break
    if found: break

if found:
    print("Cleanup old folders...")
    # Optional: remove the old empty structure
    # shutil.rmtree(full_path) 
else:
    print("Could not find the source folder.")
