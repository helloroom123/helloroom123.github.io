import shutil
import os
import glob

src_dir = '神人大头'
dst_dir = 'assets/img/wagou'

if not os.path.exists(dst_dir):
    os.makedirs(dst_dir)

# List files in source to debug
print(f"Files in {src_dir}: {os.listdir(src_dir)}")

# Copy files
files = os.listdir(src_dir)
for f in files:
    if f.endswith('.jpg'):
        src_path = os.path.join(src_dir, f)
        if '63d665' in f:
            dst_name = 'profile_main.jpg'
        else:
            dst_name = 'profile_alt.jpg'
        dst_path = os.path.join(dst_dir, dst_name)
        shutil.copy2(src_path, dst_path)
        print(f"Copied {src_path} to {dst_path}")
