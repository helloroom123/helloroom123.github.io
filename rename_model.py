import os
import json

base_dir = r"assets/live2d/teto"
old_name = "重音テト"
new_name = "teto"

def rename_files():
    # 1. Rename files in the root of base_dir
    for filename in os.listdir(base_dir):
        if old_name in filename:
            old_path = os.path.join(base_dir, filename)
            new_filename = filename.replace(old_name, new_name)
            new_path = os.path.join(base_dir, new_filename)
            try:
                os.rename(old_path, new_path)
                print(f"Renamed: {filename} -> {new_filename}")
            except OSError as e:
                print(f"Error renaming {filename}: {e}")

    # 2. Update model3.json content
    model_json_path = os.path.join(base_dir, f"{new_name}.model3.json")
    if os.path.exists(model_json_path):
        try:
            with open(model_json_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace occurrences of the old name in the JSON content
            new_content = content.replace(old_name, new_name)
            
            with open(model_json_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated content of {new_name}.model3.json")
        except Exception as e:
            print(f"Error updating JSON: {e}")

if __name__ == "__main__":
    rename_files()
