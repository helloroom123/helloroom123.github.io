import shutil
import os

def copy_file(src, dst):
    try:
        shutil.copy2(src, dst)
        print(f"Copied {src} to {dst}")
    except Exception as e:
        print(f"Error copying {src}: {e}")

# Copy Cubism 4 Core
copy_file("live2d-viewer-web-main/public/live2dcubismcore.min.js", "assets/js/live2dcubismcore.min.js")

# Copy Cubism 2 Core
copy_file("live2d_demo/assets/live2d.js", "assets/js/live2d.min.js")
