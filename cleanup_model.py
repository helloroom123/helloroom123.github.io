import os
import shutil

src_base = r"assets/live2d"

# Cleanup old Japanese folders if they still exist and are empty or duplicative
for d in os.listdir(src_base):
    if "重音" in d and os.path.isdir(os.path.join(src_base, d)):
        print(f"Removing old folder: {d}")
        shutil.rmtree(os.path.join(src_base, d))
